function toggleDarkMode(e) { 
    if(e.key === '`') {
        document.querySelector('body').classList.toggle('mode-light');
    }
}