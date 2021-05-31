---
title: .NET Generic Math
description: Or how excited I get when I see someone mention "my Attribute"
tags: dotnet generics math
---

I discovered via Twitter that Microsoft was [looking for feedback regarding a draft proposal](https://github.com/dotnet/designs/pull/205) to support generic math in .NET.

As I was reading about the proposal, I came across a discussion of something very near and dear to my heart: a particular Attribute in the .NET Framework.

But first, I'm going to meander into a lot of detail about the purpose of this new proposal and how it's better than the current solutions for Generic Math in .NET.

<!--more-->

Incidentally, I have been interested in this ability since generics were introduced in .NET 2.0. I think because I learned C++ before I learned C#, there have always been things that C++ templates supported (being done in a preprocessing phase) that I miss in C# generics.

I have come across a need for generic math from time to time. I've dabbled in math and graphics processing libraries over the years. Having to decide between `float`, `double`, and `decimal` when implementing new mathematical types is a bummer.

Here are the most obvious uses for generic math:
- Vector Math: `Vector<T>`, `Vector2<T>`, `Vector3<T>`, and `Vector4<T>`
- Matrix Math: `Matrix<T>`, `Matrix3x3<T>`, and `Matrix4x4<T>`
- Unit Conversion: `Unit<T, TDimension>`
- Generic Algorithms: `T StandardDeviation<T>(IEnumerable<T> values) { ... }`

### What We Can Do Today

There have been various ways to do this with what we currently have.

#### Dynamic Code Generation

One approach is to use dynamic code generation (usually via `System.Linq.Expressions`) to generate code that directly calls methods/operators on `<T>`. Generating code to do addition basically involves building a lambda.

```csharp
var leftOperand = Expression.Parameter(typeof(T), "left");
var rightOperand = Expression.Parameter(typeof(T), "right");
var add = 
    Expression.Lambda<Func<T, T, T>>(
        Expression.MakeBinary(
            ExpressionType.Add,
            leftOperand,
            rightOperand),
        new ParameterExpression[] { leftOperand, rightOperand }
    );

// later...
var sum = add(a, b);
```

Something simple like adding two numbers requires a lot of boilerplate. Any more complicated calculations, like adding two matrices, should have its own lambda, built entirely with a more complex tree of `Expression` objects.

While it would be possible to do 4x4 Matrix addition with just an `add` lambda defined above, it would be making 16 `delegate` calls, none of which can be inlined, and are basically the same as calling a `virtual` function.

Implementing a generic `Sum` or `StandardDeviation` function might have acceptable performance with this approach. But libraries that do vector and matrix operations generally have a goal of being highly optimized, and this approach doesn't quite cut it.

#### Operator Implementation Helper Type

Another approach that has been possible to implement before `Linq` is to add an additional type and type parameter that specifies a helper type. The helper type is a `struct`, in order to cause the generic code to be specialized for each type, but implements an interface in order to provide the contract.

```csharp
// contract for operators
public interface IMath<T> {
    T Add(T left, T right);
}

// specialization for "double" operators
public struct DoubleMath : IMath<double> {

    public double Add(double left, double right) {
        return left + right;
    }

}

// generic type
public struct Vector2<T, TMath> where TMath : IMath<T> {

    private static readonly TMath Math = Activator.CreateInstance<TMath>();

    public readonly T X;
    public readonly T Y;

    public Vector2(T x, T y) {
        X = x;
        Y = y;
    }

    public static Vector2<T, TMath> operator +(
        Vector2<T, TMath> left,
        Vector2<T, TMath> right) {
        return new Vector2<T, TMath>(
            math.Add(left.X, right.X),
            math.Add(left.Y, right.Y)
        );
    }

}
```

The problem with this approach is that it's clunky for both the library implementer and the library consumer. Instead of `Vector2<double>`, the consumer *must* use `Vector2<double, DoubleMath>`. A type alias with `using` and judicious use of `var` to avoid full type names helps, but it also adds to confusion in both the code and documentation. (We all document our code, right?)

#### Pre-Compilation Templated Code

At this point it's probably better to use some kind of templates to generate `DoubleVector`, `SingleVector`, and `DecimalVector`. This would be done pre-compilation. Many libraries choose to do this and will just have specialize types such as `Vector3f` and `Vector3d`.

In the past, [T4 Text Templates](https://docs.microsoft.com/en-us/visualstudio/modeling/code-generation-and-t4-text-templates) provided a good hook from Visual Studio for generating code during compilation.

These days, this would be a good job for a [C# Source Generator](https://devblogs.microsoft.com/dotnet/introducing-c-source-generators/).

#### Using Type Conditionals

The approach used by Microsoft for `System.Numerics.Vector<T>` is interesting. This library represents primitives have "intrinsic operations" that get substituted by the Just-in-Time compiler with highly optimized `SIMD` instructions on the processor, which are great at performing vector and matrix operations efficiently. Essentially, special processor instructions that can add multiple numbers at once are used.

While the JIT compiler replaces a lot of logic, it can fall back on normal code generation, so the C# code needs to have the logic for all of the numeric data types that are supported.

As a result, `System.Numerics.Vector<T>` has a lot of code that uses big blocks of conditional logic with casts.

```csharp
// adding two numbers, most conditions removed for brevity
else if (typeof(T) == typeof(long))
{
    return (T)(object)(long)((long)(object)left + (long)(object)right);
}
else if (typeof(T) == typeof(float))
{
    return (T)(object)(float)((float)(object)left + (float)(object)right);
}
else if (typeof(T) == typeof(double))
{
    return (T)(object)(double)((double)(object)left + (double)(object)right);
}
```

Because `<T>` is a `struct`, when the JIT compiler generates machine code that is specialized for each `<T>`. So `Vector<float>` and `Vector<double>` compile to unique machine code, mostly because they are different sizes. But all of the `if` conditionals that apply to other types get optimized away, and the redundant casts (`(object)(double)`?) that make the C# compiler happy also go away, and there's no boxing penalties despite the casts to `object`.

### The Ideal Solution

With the exception of the dynamic code generation solution (via `System.Linq.Expressions`), the problem with these solutions is that they don't automatically work when a new "number type" is introduced. Usually `decimal` gets omitted because IEEE floating point calculations are "good enough" and fast. But a unit-conversion library would likely benefit from being able to use `decimal` as well.

The base class library is also adding new numeric types all the time. Recently, we got `System.Half`, a 16-bit floating point number, often used in machine learning. I believe that `System.Quad` is likely to be coming soon, as well as some sort of floating point analogue to `System.Numerics.BigInteger`.

This is also ignoring the fact that generic math is also useful for integers, and we already have `sbyte`, `byte`, `short`, `ushort`, `int`, `uint`, `long`, `ulong`, and many others probably on the way as well.

Being able to constrain a generic type parameter `<T>` to types that implement certain operators would help, but it doesn't stop at operators. What about functions like `Abs`, `Sqrt`, or `Sin`? These functions are defined in `System.Math` for primitive types. But some functions, like `Sqrt` or `Sin` only support `double`, which is why we now have `System.MathF`.

Making the primitive numeric types implement some interfaces for generic math is the biggest hurdle. And some of these generic math operations would need to be static methods and properties. For example, how would you get a value of type `<T>` that represents `1`? An interface can't have a `static T One { get; }` property.

The proposal at hand, that I mentioned at the start of this rambling, is to allow interfaces to define static properties and methods, including **operators**!

### What's This About an Attribute?

One of the C# language proposals required for this functionality is [Relaxing shift operator requirements](https://github.com/dotnet/csharplang/issues/4666).

When the C# language designers were coming up with the rules for C#, they wanted operator overloading, but they didn't want developers to use it in the way that C++ libraries often did. As a result, there are some restrictions, like `==` and `!=` needing to be implemented in pairs.

The shift operator is interesting because the C++ Standard Template Library has overloaded the bit-shift operators on streams to behave as "stream insertion" and "stream extraction" operators.

To write to stream `cout` (Console Output), C++ developers can use `<<`.

```cpp
std::cout << "Hello, World!";
```

C# prevented this kind of thing by requiring that the right-hand parameter for the `<<` and `>>` operators be an `int`.

Eventually, Visual Basic also got overloaded operators. At the time, I was writing some .NET libraries, and I was very interested in being useful to all languages in the .NET ecosystem, including VB.

VB has some operators that C# does not, and some of them are overloadable. These include `&` (string concatenation), `\` (integer division), `^` (exponentiation), and `Like` (string pattern matching).

Wanting to support the `^` operator in VB on a numeric type I was writing in C#, I submitted a feature request that C# should allow defining operators for other languages.

*(All of this history is lost because Microsoft has switched feedback tools several times over the years. There are also C# language bugs I've reported that are lost to the void.)*

An overload operator gets compiled to a `static` method with a special name. The addition (`+`) operator becomes `public static op_Addition(T left, T right)`. There is a metadata flag for the method that indicates that this is a "special name", which is readable with reflection via `MethodBase.IsSpecialName`. At the time, there was no way to add this flag to any method manually. It was up to the compiler to do it.

My request suggested that a C# library should be able to define the VB `^` operator (or other operators) by manually defining an `op_Exponent` method and having some mechanism for including the "special name" flag.

I had a few different ideas.

```csharp
// new use of "operator" keyword
public static operator MyType op_Exponent(MyType value, MyType power) { ... }

// use a new Attribute
[Operator]
public static MyType op_Exponent(MyType value, MyType power) { ... }
```

I would have preferred the first example, using the existing `operator` keyword in a new way. However, this would have required a change to the C# parser, and this change was pretty close to the release date and the C# compiler was already able to read attributes.

The C# compiler team ended up going with the on-the-nose `[SpecialName]` Attribute that C# checks and uses to add the `IsSpecialName` metadata flag. As a result, this isn't just limited to just operators.

As a matter of fact, I'm pretty sure `[SpecialName]` can be manually used on a method named `get_MyValue()` to make it into a property.

Needless to say, I was excited that my suggestion made it into the C# product. I like to claim that I'm responsible for the existence of `System.System.Runtime.CompilerServices.SpecialNameAttribute`.

Without it, the workaround was to modify the assembly after compilation to add the `IsSpecialName` metadata flag. This could be done by disassembling to IL, modifying the `MSIL` code, and reassembling.

When the official release with `[SpecialName]` came out, I started playing with it. One of the things I discovered is that it let you sidestep C#'s rules for operators.

So there was now nothing stopping you from emulating C++'s stream insertion/extraction operator.

```csharp
using System.IO;
using System.System.Runtime.CompilerServices;

public class CppStream {

    private readonly TextWriter writer;

    public CppStream(TextWriter writer) {
        this.writer = writer;
    }

    [SpecialName]
    public static CppStream op_LeftShift(CppStream output, object value) {
        output.writer.Write(value);
        return output;
    }

}

// elsewhere (must be in another assembly, though)
CppStream cout = new CppStream(Console.Out);
cout << "Hello, World!";
```

Oh no! We broke the rules!

I kept quiet about this because it really didn't matter. Even within the rules, a library can do horrible things with operator overloading. Honestly, you don't even need operator overloading to do horrible things.

But it turns out that I wasn't the only one that noticed. Tanner Gooding on the .NET Libraries team also knows about this workaround, and [mentioned it directly](https://github.com/dotnet/csharplang/issues/4666#issuecomment-821730180) when commenting about why this restriction should be removed.

That's my Attribute! It so rarely comes up, but it's being discussed for something I discovered years ago and wasn't sure anyone knew. I was actually keeping this in my pocket as a programming quiz: "Implement C++'s stream insertion operator in C#"

I guess the cat is out of the bag now (for all three of my readers). All because I got excited for **MY ATTRIBUTE**!
