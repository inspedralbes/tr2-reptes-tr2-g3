# MongoDB vs SQL: Per què escollir un model NoSQL?

La decisió entre MongoDB i SQL no depèn de quina eina és millor, sinó de quin **model de dades** s'adapta millor al teu projecte. MongoDB destaca especialment en entorns moderns per tres motius clau:

---

### 1. Flexibilitat de l'Esquema (Schema-less)
A diferència de SQL, on les dades han de seguir una estructura de taules i columnes predefinida, MongoDB utilitza **documents dinàmics**:
* **Adaptabilitat:** Pots afegir nous camps a un document sense afectar els altres ni aturar la base de dades.
* **Dades complexes:** Permet niuar informació (com llistes o sub-documents) dins d'un mateix registre, evitant la fragmentació.

### 2. Escalabilitat Horitzontal (Sharding)
MongoDB va ser dissenyat des de zero per créixer de forma distribuïda:
* **Sharding:** Pots repartir les dades entre desenes o centenars de servidors (nodes).
* **Cost-eficiència:** És més econòmic afegir diversos servidors petits que un de sol extremadament potent i car (com requereix habitualment SQL).

### 3. Agilitat i Rendiment
L'arquitectura de MongoDB està pensada per a la velocitat de desenvolupament:
* **Format JSON/BSON:** Les dades es guarden de la mateixa manera que es manipulen en el codi (JavaScript, Python, etc.), eliminant la necessitat de transformacions complexes.
* **Menys Joins:** En tenir les dades relacionades dins del mateix document, les consultes de lectura solen ser molt més ràpides per a aplicacions en temps real.

---

| Característica | SQL (Relacional) | MongoDB (NoSQL) |
| :--- | :--- | :--- |
| **Estructura** | Taules fixes | Documents flexibles |
| **Escalabilitat** | Vertical (Més CPU/RAM) | Horitzontal (Més servidors) |
| **Desenvolupament** | Més lent (requereix migracions) | Més ràpid (iteració constant) |

> **En resum:** MongoDB és l'opció guanyadora per a aplicacions de **Big Data, catàlegs de productes canviants, gestió de continguts i prototipat ràpid**.