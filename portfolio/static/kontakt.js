document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    try {
        const response = await fetch(window.location.pathname, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        });

        if (response.ok) {
            alert('Wiadomość została wysłana!');
            this.reset();
        } else {
            alert('Błąd podczas wysyłania.');
        }
    } catch (error) {
        alert('Błąd połączenia.');
    }
});