document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const messages = {
        pl: {
            success: 'Wiadomość została wysłana!',
            error: 'Błąd serwera.',
            connection: 'Błąd połączenia.'
        },
        en: {
            success: 'Message has been sent!',
            error: 'Server error.',
            connection: 'Connection error.'
        }
    };

    const msg = currentLang === 'en' ? messages.en : messages.pl;

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
            alert(msg.success);
            this.reset();
        } else {
            alert(msg.error);
        }
    } catch (error) {
        alert(msg.connection);
    }
});