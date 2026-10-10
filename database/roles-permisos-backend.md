# Roles y permisos de MIGUEL

Ejecutar `configurar-roles-permisos.sql` completo en Supabase SQL Editor.
No se ha ejecutado automáticamente sobre la base desplegada.

Requisitos: las ocho cuentas de Authentication deben existir; cada uno de los
seis docentes debe tener un registro único cuyo DNI coincida exactamente con el
usuario del correo. Los IDs de las tablas deben tener su valor predeterminado
o identidad configurados. Si falla una comprobación, se revierte la transacción.

El SQL crea o actualiza los roles ADMIN y DOCENTE y los 12 permisos de submenú.
Conserva los IDs de los registros existentes, las contraseñas de Auth y las
secciones asignadas. Desactiva otros roles de las ocho cuentas indicadas y
otros permisos del rol DOCENTE. No modifica las asignaciones de otras cuentas.
Un usuario existente inactivo sigue inactivo.

| Código | Nombre del submenú | ADMIN | DOCENTE |
|---|---|---|---|
| INICIO | Inicio | Sí | No |
| ASISTENCIA | Asistencia | Sí | Sí |
| CALIFICACIONES | Calificaciones | Sí | Sí |
| AGENTE_ACADEMICO | Agente académico | Sí | Sí |
| REGISTRO_CLASES | Registro de clases | Sí | No |
| MATRICULA | Matrícula | Sí | No |
| DOCENTES | Docentes | Sí | No |
| ALUMNOS | Alumnos | Sí | No |
| CURSOS | Cursos | Sí | No |
| ASIGNAR_CURSOS | Asignar cursos | Sí | No |
| PLAN_EVALUACION | Plan de evaluación | Sí | No |
| CONFIGURACION | Configuración | Sí | No |

ADMIN recibe además los permisos activos que ya existan en el catálogo.
Los administradores, con únicamente el rol ADMIN, son:

- Eloy Gonzalo Alva Calderon: 70375812@miguelgrau.com.
- Hugo Flores Rodriguez: hugo.flores@escuela.pe.

Los nombres se guardan en los campos opcionales nombres, apaterno y amaterno
de mg_usuario. El script completo agrega estas columnas y completa los campos
vacíos desde los docentes vinculados. Después, el nombre de la cuenta se lee
desde mg_usuario. Para aplicar solo este cambio, ejecutar agregar-nombres-usuarios.sql.

El backend debe incluir estos tres campos de mg_usuario dentro de usuario en
/login y /login/me y en las respuestas de /usuarios. POST/PUT /usuarios deben
aceptarlos como opcionales y admitir null. El encabezado del frontend consume
estos campos; no usa el nombre de mg_docente como alternativa. Si faltan en
la respuesta del backend, muestra el identificador usuario.

## Integración obligatoria en el backend

1. Validar el access_token de Supabase Auth y el estado de mg_usuario.
2. En /login y /login/me, devolver los códigos de roles activos mediante
   mg_usuario_rol → mg_rol. El frontend actual reconoce ADMIN y DOCENTE.
3. Para los submenús, obtener los permisos activos mediante
   mg_usuario_rol → mg_rol → mg_rol_permiso → mg_permiso. Para hacer dinámica
   la interfaz en futuras asignaciones se deberá incluir también esta lista
   en la respuesta y consumirla en el frontend; el frontend actual usa roles.
4. Antes de consultar datos de un grado, comprobar tanto el permiso del
   submenú como el grado correspondiente a la sección o matrícula solicitada.
   No confiar en un id_usuario enviado desde el frontend.
5. Las funciones mg_puede_acceder_submenu(codigo) y
   mg_puede_ver_grado(id_grado) usan auth.uid(). Deben llamarse en el contexto
   del JWT verificado del usuario, con un cliente que respete ese contexto.
   Si el backend consulta con service_role, tiene que aplicar los controles
   equivalentes explícitamente; ese rol omite RLS.
6. Asistencia y calificaciones de DOCENTE son consultas del grado asignado.
   El permiso de abrir un submenú no autoriza escrituras: estas necesitan
   una comprobación separada. El docente no debe generar plantillas globales.
7. Aplicar las mismas restricciones a las consultas auxiliares de alumnos,
   matrículas, cursos, notas y asistencias. El filtrado visual no es seguridad.
8. Cada herramienta del chatbot debe comprobar el permiso AGENTE_ACADEMICO
   y filtrar los datos académicos por el grado permitido. Las conversaciones
   también deben pertenecer al usuario autenticado. No basta con instrucciones
   al modelo para limitar el acceso.

La función de grado autoriza todos los alumnos y secciones del mismo id_grado
que tenga una sección activa asignada al docente como responsable. El nivel
y año deben estar activos. No confunde grados del mismo nombre en distintos
niveles o años. El frontend local sigue mostrando las secciones asignadas,
un alcance más reducido; no se amplió a otras secciones sin aclaración.

El SQL NO instala políticas RLS ni modifica las Edge Functions desplegadas.
Falta inspeccionar las tablas de notas, asistencia y chat y sus políticas
antes de preparar esa migración. No considerar terminada la seguridad hasta
verificar que un docente no puede leer otros grados mediante una llamada
directa a la API ni a través del chatbot.

## Verificación tras aplicar el backend

- Los seis docentes reciben exactamente DOCENTE y los tres permisos indicados.
- 70375812 y hugo.flores@escuela.pe reciben únicamente ADMIN y todos los permisos activos.
- Un docente puede consultar su grado y recibe 403 o una lista vacía al pedir
  otro grado, incluidas las herramientas del chatbot.
- El administrador puede consultar todos los grados.
- Roles inactivos, permisos inactivos y usuarios inactivos no dan acceso.
- Repetir el script no duplica registros ni cambia contraseñas.
- Cerrar sesión y volver a ingresar para recibir las nuevas asignaciones.
