# 🏫 ENGINY: Sistema de Gestió de Tallers Educatius

Aquest projecte consisteix en el disseny, desenvolupament i posada en marxa d'una plataforma web integral per a la gestió, sol·licitud i assignació de tallers en centres educatius. L'aplicatiu connecta centres, professors i administradors per automatitzar el procés de reserva i la logística pedagògica.

## 📋 Objectiu de l'Encàrrec
L'aplicatiu permet als centres educatius sol·licitar tallers d'un catàleg, indicar el nombre d'alumnes i rebre assignacions automàtiques. També centralitza la coordinació de professors referents i el seguiment.

## 🚀 Àrees del Sistema

### 1. Àrea de Centres 🏫
* **Peticions:** Formulari de nova petició de tallers.
* **Seguiment:** Consulta en temps real de l'estat de les sol·licituds i recepció d'assignacions.
* **Validació:** Checklist final per confirmar la realització.

### 2. Àrea d'Administració (Coordinació) ⚙️
* **Gestió del Catàleg:** Creació, edició i arxiu de l'oferta de tallers.
* **Motor d'Assignació:** Algorisme de distribució de places.
* **Logística:** Designació de professors referents i enviament de notificacions automàtiques.
* **Analítica:** Generació d'informes, llistes d'alumnes i estadístiques de participació.

### 3. Àrea de Professors 👨‍🏫
* **Consultes:** Visualització dels tallers assignats com a referents.
* **Notificacions:** Recepció d'avisos automàtics per a la gestió de les seves tasques.

## 🛠️ Tecnologies Utilitzades
* **Frontend:** Vue.js (Framework reactiu).
* **Backend:** Node.js / JavaScript.
* **Contenidors:** Docker i Docker Compose per a l'orquestració de l'entorn.

## 📂 Estructura del Repositori
* `/backend`: Lògica del servidor i motor d'assignació.
* `/enginy`: Codi font del Frontend (Vue).
* `/doc`: Documentació del projecte i requeriments funcionals.

## 🚀 Instal·lació i Execució
1. Clona el repositori:
   ```Bash
   git clone [https://github.com/inspedralbes/tr2-reptes-tr2-g3.git](https://github.com/inspedralbes/tr2-reptes-tr2-g3.git)
   ```
Aixeca el sistema amb Docker:

```Bash
docker-compose up --build
```

## 👥 Membres del Projecte
Aquest projecte ha estat desenvolupat per:

Angel Cuadra

Eric Ruiz

Matías Negrón

Aymar Ramos