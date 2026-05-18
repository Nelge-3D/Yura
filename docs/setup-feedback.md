# Setup Feedback Google Sheets

## Prérequis
Compte Google. Gratuit. Zéro coût serveur.

---

## Étapes

### 1. Créer le Google Sheet
1. Va sur [sheets.google.com](https://sheets.google.com) → **Nouveau**
2. Nomme-le `YURA Feedback Beta`
3. Ajoute ces en-têtes en ligne 1 (dans cet ordre) :

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| date | uuid | etat_debut | etat_fin | nb_messages | duree | note | commentaire | version |

---

### 2. Créer le Apps Script
1. Dans le sheet : **Extensions → Apps Script**
2. Remplace tout le contenu par ce code :

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.uuid,
    data.etatDebut,
    data.etatFin,
    data.nbMessages,
    data.dureeMinutes,
    data.note,
    data.commentaire || "",
    data.version
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Clique **Enregistrer** (icône disquette)

---

### 3. Déployer
1. **Déployer → Nouveau déploiement**
2. Type : **Application web**
3. Paramètres :
   - Exécuter en tant que : **Moi**
   - Accès autorisé à : **Tout le monde** *(anonyme, nécessaire)*
4. Clique **Déployer** → autorise les permissions
5. **Copie l'URL** de déploiement (format : `https://script.google.com/macros/s/...`)

---

### 4. Configurer l'app YURA

Dans `.env.local` (jamais committé) :

```env
NEXT_PUBLIC_FEEDBACK_URL=https://script.google.com/macros/s/TON_ID_ICI/exec
```

Pour Vercel : **Settings → Environment Variables** → ajoute la même clé.

> Si la variable est absente, le bouton feedback s'affiche quand même mais n'envoie rien. Aucune erreur visible.

---

### 5. Tester
```bash
curl -X POST "https://script.google.com/macros/s/TON_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"test","etatDebut":"neutre","etatFin":"calme","nbMessages":6,"dureeMinutes":5,"note":1,"commentaire":"test","version":"1.1.0"}'
```

Vérifie que la ligne apparaît dans le sheet.
