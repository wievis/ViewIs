document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    try {
        const response = await fetch('/kontakt/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.ok) {
            alert('Wiadomość została wysłana!');
            this.reset();
        } else {
            alert('Błąd serwera.');
        }
    } catch (error) {
        alert('Błąd połączenia.');
    }
});