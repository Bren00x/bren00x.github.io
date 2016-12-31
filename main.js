 var xhr= new XMLHttpRequest();
xhr.open('GET', 'upload/news.htm', true);
xhr.onreadystatechange= function() {
    if (this.readyState!==4) return;
    if (this.status!==200) return; // or whatever error handling you want
    document.getElementById('news').innerHTML= this.responseText;
};
xhr.send();
                var xhr= new XMLHttpRequest();
xhr.open('GET', 'upload/nav.htm', true);
xhr.onreadystatechange= function() {
    if (this.readyState!==4) return;
    if (this.status!==200) return; // or whatever error handling you want
    document.getElementById('nav').innerHTML= this.responseText;
};
xhr.send();