# ZendoApp — cómo ponerla en marcha

La app se instala en el celular desde el navegador (PWA). Los datos se guardan en Firebase.
Mientras no pegues la configuración de Firebase en `config.js`, la app funciona en **modo demo** con datos de ejemplo.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa |
| `config.js` | **El único que editás**: configuración de Firebase y tu email de profe |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |
| `manifest.json`, `sw.js`, `icons/` | Lo que hace que se pueda instalar en el celular |
| `vercel.json` | Para que Vercel siempre sirva la última versión |

## 1. Crear el proyecto de Firebase

1. Entrá a https://console.firebase.google.com y creá un proyecto nuevo (por ejemplo `zendoapp`). Google Analytics no hace falta.
2. **Firestore:** menú *Compilación → Firestore Database → Crear base de datos*. Elegí la ubicación `southamerica-east1` (São Paulo) y modo producción.
3. **Reglas:** en Firestore, pestaña *Reglas*, borrá lo que hay y pegá el contenido de `firestore.rules`. Cambiá `TU_EMAIL_DE_PROFE@ejemplo.com` por tu email y tocá *Publicar*.
4. **Acceso:** menú *Compilación → Authentication → Comenzar*. En *Método de acceso* activá:
   - **Correo electrónico/contraseña** (para vos).
   - **Anónimo** (para los alumnos, que entran con nombre y apellido).
5. **Tu usuario de profe:** en Authentication, pestaña *Usuarios → Agregar usuario*. Poné tu email y una contraseña.
6. **La configuración:** en *Configuración del proyecto* (el engranaje) → *Tus apps* → ícono web `</>`. Registrá la app con el nombre ZendoApp (sin Hosting). Te muestra un bloque `firebaseConfig`.

## 2. Editar `config.js`

Pegá el `firebaseConfig` en `window.FIREBASE_CONFIG` y poné tu email en `window.ADMIN_EMAIL`. Tiene que ser el mismo email que en las reglas y en el usuario de Authentication.

## 3. Subir a GitHub y Vercel

1. Creá un repositorio nuevo en GitHub (por ejemplo `zendoapp`) y subí todos estos archivos tal cual, con la carpeta `icons`.
2. En https://vercel.com → *Add New → Project* → importá el repositorio. No hay que tocar ninguna opción: *Framework Preset: Other* → *Deploy*.
3. Vercel te da la dirección (por ejemplo `zendoapp.vercel.app`).
4. **Importante:** en Firebase → Authentication → *Configuración → Dominios autorizados*, agregá esa dirección de Vercel.

## 4. Primer uso

1. Entrá a la dirección, tocá **SOY EL PROFE** y entrá con tu email y contraseña.
2. En ⚙ Ajustes revisá cupo, días, turnos y precios. Activá los avisos en tu celular.
3. En Alumnos cargá cada alumno. Su clave es nombre y apellido todo junto, en minúscula y sin tildes (por ejemplo `lucíaromero` → `luciaromero`).

## 5. Instalar en el celular

- **Android (Chrome):** abrí la dirección → menú ⋮ → *Instalar app* (o *Agregar a pantalla de inicio*).
- **iPhone (Safari):** abrí la dirección → botón Compartir → *Agregar a inicio*.

## Actualizar la app

Cada vez que cambies algo, subí el número de `VERSION` en `sw.js` (por ejemplo `zendoapp-v2`) para que los celulares descarguen la versión nueva.

## Límites de esta versión

- Los avisos de solicitudes de turno llegan mientras tenés la app abierta o en segundo plano. Para que lleguen con la app cerrada hace falta sumar Firebase Cloud Messaging más adelante.
- La clave de los alumnos es nombre + apellido, como en FIGHT OS. Cualquiera que sepa el nombre y apellido de un alumno puede entrar como él y ver su ficha y el ranking. Los pagos sólo los ve el profe.
