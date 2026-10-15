document.querySelectorAll('.js-contact-form').forEach(form => {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const en = document.documentElement.lang === 'en';
        const t = en
            ? { sending: 'Sending...', ok: 'Message sent. I will reply shortly.', err: 'Server error. Please try again.', conn: 'Connection error.' }
            : { sending: 'Wysyłanie...', ok: 'Wiadomość wysłana. Odpowiem wkrótce.', err: 'Błąd serwera. Spróbuj ponownie.', conn: 'Błąd połączenia.' };
        const status = form.querySelector('.form-status');
        const btn = form.querySelector('button[type=submit]');
        const set = (msg, cls) => { if (status) { status.textContent = msg; status.className = 'form-status ' + (cls || ''); } };
        const token = form.querySelector('[name=csrfmiddlewaretoken]');
        btn.disabled = true;
        set(t.sending);
        try {
            const response = await fetch('/kontakt/', {
                method: 'POST',
                body: new FormData(form),
                headers: { 'X-CSRFToken': token ? token.value : '', 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.ok) { set(t.ok, 'ok'); form.reset(); }
            else { set(t.err, 'err'); }
        } catch (err) {
            set(t.conn, 'err');
        } finally {
            btn.disabled = false;
        }
    });
});
