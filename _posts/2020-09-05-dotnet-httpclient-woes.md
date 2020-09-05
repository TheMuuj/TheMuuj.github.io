---
title: .NET HttpClient Woes
tags: development DotNetCore DotNetFramework CSharp Http
---

If you've done work with .NET's `HttpClient` before and have searched for best practices for using it, you may have encountered this warning: "[You're Using HttpClient wrong and it's destabilizing your software](https://aspnetmonsters.com/2016/08/2016-08-27-httpclientwrong/)."

And if you're having trouble with your SSL client certificates not being sent via your `HttpClient` on .NET Framework, continue reading. I may be able to help.

<!--more-->

When you're writing new code against a newer version of .NET Core 2.1 or later, then [Microsoft already has a solution](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/use-httpclientfactory-to-implement-resilient-http-requests) via `IHttpClientFactory`.

Unfortunately, this is not a solution for everyone, though. Microsoft even specifically states:

> The implementation of `IHttpClientFactory` (`DefaultHttpClientFactory`) is tightly tied to the DI implementation in the `Microsoft.Extensions.DependencyInjection NuGet package`. For more information about using other DI containers, see this [GitHub discussion](https://github.com/dotnet/extensions/issues/1345).

My project's code base is in a transition state from .NET Framework to .NET Core, and is mainly implemented in .NET Standard libraries. I can't use any .NET Core-specific solutions just yet.

This is where things can get murky. There are several third-party libraries out there that try to level the playing field a bit. I don't have any specific opinions on any of them.

After researching the various issues, I came up with a few guidelines:

- **Don't** use a static instance of `HttpClient`. This is just as well, as there are a lot of configurable properties on `HttpClient` that make using a single instance less than ideal, and sometimes not possible. This was certainly true in my case.
- **Don't** create and dispose `HttpClient` instances as-needed with the default constructor, as this will hurt performance. The default constructor creates an underlying `HttpMessageHandler` that will be disposed when the `HttpClient` is disposed.
- **Do** share `HttpMessageHandler` instances as much as possible and pass them to the `HttpClient` constructor.
- **Do** choose the right `HttpMessageHandler` for your situation. It needs to be different on .NET Framework, .NET Core, Xamarin, and possibly different based on whether you are writing a client or server application.
- **Do** change settings to deal with DNS caching issues. The solution for this differs greatly on .NET Framework and .NET Core. On .NET Framework, you will probably need to resort to `ServicePointManager.DnsRefreshTimeout`. This is a singleton design, which means the state will be shared among all HTTP Requests. Luckily this class has been implemented as a no-op in .NET Core so you don't need a lot of conditional code.

I'm not going to even try to advocate a single solution that will work in every situation. The reason I bring all of this up is in case somebody hits the same brick wall I hit. Hopefully if that happens, your Google search will have brought you here.

I was developing a .NET Standard library that uses `HttpClient` to access a REST API that requires a SSL client certificate to verify the identity of the client making the request. The project currently uses .NET Framework 4.7.2 (and *might* see an upgrade to 4.8). I also like to run tests as much as possible against .NET Core 3.1 to be prepared to fully migrate away from Framework.

For whatever reason, when running on .NET Framework, the SSL client certificate was not being used to sign the HTTPS requests. It worked fine on .NET Core with both the default `HttpClientHandler` and with the newer `SocketsHttpHandler`.

**Aside:** This may actually be related to a [similar issue in Internet Explorer](https://support.microsoft.com/en-us/help/2988411/client-certificate-request-fails-when-tls-1-2-and-1-1-secure-protocols), which leads me to suspect that it might actually be caused by failed TLS Protocol negotiation between the client and server.

There are several `HttpMessageHandler` implementations, each with subtle differences.

- `HttpClientHandler`: This is the default implementation, shared between .NET Framework and .NET Core.
- `SocketsHttpHandler`: This is now the default implementation in .NET Core 2.1, which has better support on non-Windows platforms but is not supported in .NET Framework.
- `WebRequestHandler`: This is specifically for desktop-specific apps, including features not available for Windows store apps. I found lots of references that said I should be using this on .NET Framework.
- `NSUrlSessionHandler`: This is specifically for Apple platforms running on the Xamarin stack.
- `CFNetworkHandler`: Not much documentation on this one, but it's also Apple/Xamarin-specific.
- `WinHttpHandler`: Based on the `WinHTTP` interface of Windows, intended for use in server environments.

Once I discovered `WinHttpHandler` and saw that it was for server environments, I realized it was the best fit for my project, and I hoped it was the solution I was looking for. Sure enough, it worked, and the appropriate Client Certificate was being used to sign the requests.

However, the various implementations of `HttpMessageHandler` have similar properties for configuring the HTTP requests, but they aren't on a shared base class and sometimes have slightly different names.

For example, `HttpClientHandler` has an `AllowAutoRedirect` property, and `WinHttpHandler` has an `AutomaticRedirection` property.

My solution was *MORE LAYERS OF ABSTRACTION!* I hooked into my project's existing dependency injection. I created a separate class called `HttpClientOptions` to unify how these instances should be configured, and added an interface similar to this:

```csharp
using System.Net.Http;

namespace TheMuuj.Blog {

    public interface IHttpMessageHandlerFactory {
        HttpMessageHandler CreateHttpMessageHandler(HttpClientOptions options);
    }

}
```

Then I simply implemented a `WinHttpHandlerFactory` in a .NET Framework-specific assembly, and a `SocketsHttpHandlerFactory` in a .NET Core-specific assembly. Each of these reads the `options` and configures their respective handlers appropriately. Finally, I register the appropriate implementation in the dependency injection container based on the hosting project's underlying platform.

Hopefully everything will "just work" once the project is fully migrated away from .NET Framework.
