
document.addEventListener('DOMContentLoaded', () => {
    const progress = document.getElementById('progress');
    

    setTimeout(() => {
        progress.style.width = '100%';
    }, 100);


    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});