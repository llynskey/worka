namespace Worka.Services.Email
{
    /// <summary>
    /// Localized copy for outgoing emails. Templates are keyed by the two-letter
    /// UI language the account is using; anything unrecognised falls back to
    /// English. Only the languages Fixa ships full UI packs for are translated.
    /// </summary>
    public static class EmailTemplates
    {
        /// <summary>
        /// Builds the password-reset email in the caller's language.
        /// </summary>
        public static (string Subject, string Body) PasswordReset(
            string language, string firstName, string resetLink)
        {
            var name = string.IsNullOrWhiteSpace(firstName) ? "there" : firstName;

            switch (Normalize(language))
            {
                case "es":
                    return (
                        "Restablece tu contraseña de Fixa",
                        $"Hola {name},\n\n" +
                        "Alguien solicitó restablecer la contraseña de esta cuenta de Fixa. " +
                        $"Si fuiste tú, abre el siguiente enlace en menos de una hora:\n\n{resetLink}\n\n" +
                        "Si no lo solicitaste, puedes ignorar este correo: tu contraseña no ha cambiado.\n\n" +
                        "— Fixa");

                case "fr":
                    return (
                        "Réinitialisez votre mot de passe Fixa",
                        $"Bonjour {name},\n\n" +
                        "Quelqu'un a demandé à réinitialiser le mot de passe de ce compte Fixa. " +
                        $"Si c'était vous, ouvrez le lien ci-dessous dans l'heure qui suit :\n\n{resetLink}\n\n" +
                        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail — votre mot de passe reste inchangé.\n\n" +
                        "— Fixa");

                case "de":
                    return (
                        "Setze dein Fixa-Passwort zurück",
                        $"Hallo {name},\n\n" +
                        "Jemand hat angefragt, das Passwort für dieses Fixa-Konto zurückzusetzen. " +
                        $"Wenn du das warst, öffne den folgenden Link innerhalb einer Stunde:\n\n{resetLink}\n\n" +
                        "Wenn du das nicht angefragt hast, kannst du diese E-Mail ignorieren – dein Passwort bleibt unverändert.\n\n" +
                        "— Fixa");

                case "it":
                    return (
                        "Reimposta la tua password Fixa",
                        $"Ciao {name},\n\n" +
                        "Qualcuno ha chiesto di reimpostare la password di questo account Fixa. " +
                        $"Se sei stato tu, apri il link qui sotto entro un'ora:\n\n{resetLink}\n\n" +
                        "Se non hai richiesto tu questa operazione, puoi ignorare questa email: la tua password resta invariata.\n\n" +
                        "— Fixa");

                case "pt":
                    return (
                        "Redefina a sua palavra-passe da Fixa",
                        $"Olá {name},\n\n" +
                        "Alguém pediu para redefinir a palavra-passe desta conta Fixa. " +
                        $"Se foi você, abra o link abaixo dentro de uma hora:\n\n{resetLink}\n\n" +
                        "Se não fez este pedido, pode ignorar este e-mail — a sua palavra-passe permanece inalterada.\n\n" +
                        "— Fixa");

                case "nl":
                    return (
                        "Stel je Fixa-wachtwoord opnieuw in",
                        $"Hallo {name},\n\n" +
                        "Iemand heeft gevraagd om het wachtwoord van dit Fixa-account opnieuw in te stellen. " +
                        $"Als jij dat was, open dan de onderstaande link binnen een uur:\n\n{resetLink}\n\n" +
                        "Heb je dit niet aangevraagd, dan kun je deze e-mail negeren — je wachtwoord blijft ongewijzigd.\n\n" +
                        "— Fixa");

                case "ro":
                    return (
                        "Resetează-ți parola Fixa",
                        $"Bună {name},\n\n" +
                        "Cineva a cerut resetarea parolei pentru acest cont Fixa. " +
                        $"Dacă tu ai fost, deschide linkul de mai jos în decurs de o oră:\n\n{resetLink}\n\n" +
                        "Dacă nu ai cerut acest lucru, poți ignora acest e-mail — parola ta rămâne neschimbată.\n\n" +
                        "— Fixa");

                default:
                    return (
                        "Reset your Fixa password",
                        $"Hi {name},\n\n" +
                        "Someone asked to reset the password for this Fixa account. " +
                        $"If that was you, open the link below within one hour:\n\n{resetLink}\n\n" +
                        "If you didn't ask for this, you can ignore this email — your password is unchanged.\n\n" +
                        "— Fixa");
            }
        }

        /// <summary>Reduces a language tag (e.g. "pt-BR") to its base code.</summary>
        private static string Normalize(string language)
        {
            if (string.IsNullOrWhiteSpace(language))
            {
                return "en";
            }

            var code = language.Trim().ToLowerInvariant();
            return code.Length > 2 ? code.Substring(0, 2) : code;
        }
    }
}
