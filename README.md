# Auto Like / Nope Pro (Tampermonkey)

## Descripción

Script para Tampermonkey que automatiza clics en los botones Like y Nope.

Características:

- Cantidad de clics configurable.
- Porcentaje de Nope configurable.
- Contador en tiempo real.
- Estado de ejecución.
- Restricción por dominio.
- Botón Iniciar / Detener.
- Consola de depuración.
- Sin alertas emergentes.

---

## Configuración del sitio

Modificar la variable:

javascript const SITIOS_PERMITIDOS = [     'tinder.com',     'www.tinder.com' ]; 

Para permitir otros dominios:

javascript const SITIOS_PERMITIDOS = [     'midominio.com' ]; 

---

## Configuración de porcentaje

Ejemplos:

| % Nope | Frecuencia |
|---------|------------|
| 25 | 1 Nope cada 4 clics |
| 20 | 1 Nope cada 5 clics |
| 10 | 1 Nope cada 10 clics |
| 5 | 1 Nope cada 20 clics |

La frecuencia se calcula mediante:

javascript Math.round(100 / porcentajeNope) 

---

## Panel de control

El panel muestra:

- Cantidad de clics.
- Porcentaje de Nope.
- Frecuencia calculada.
- Estado actual.
- Total ejecutado.
- Likes realizados.
- Nopes realizados.

---

## Estados posibles

text Esperando... Ejecutando... Detenido Finalizado Botones no encontrados Cantidad de clics inválida Porcentaje Nope inválido 

---

## Funciones principales

### buscarBotones()

Busca los botones Like y Nope dentro de:

javascript .gamepad-button-wrapper 

---

### actualizarContador()

Actualiza:

text Total Likes Nope 

en el panel.

---

### setStatus()

Actualiza el estado visible.

Ejemplo:

javascript setStatus('Ejecutando...'); setStatus('Detenido'); setStatus('Finalizado'); 

---

### iniciar()

Valida:

- maxClicks
- porcentajeNope
- existencia de botones

e inicia el intervalo.

---

### detener()

Detiene la ejecución y reinicia el botón.

---

## Depuración

La consola utiliza el prefijo:

text [AutoLikeNope] 

Ejemplos:

text [AutoLikeNope] Script cargado [AutoLikeNope] Botón Like encontrado [AutoLikeNope] Botón Nope encontrado [AutoLikeNope] Ejecutando [AutoLikeNope] Finalizado 

---

## Mejoras futuras

- Intervalo aleatorio entre clics.
- Probabilidad real de Nope usando Math.random().
- Guardar configuración en localStorage.
- Minimizar panel.
- Estadísticas históricas.
- Reanudar ejecución.
- Exportar métricas.
```
:::

Después puedes pegar debajo de ese documento el script completo como sección "Código Fuente", lo que te permitirá mantener una única referencia para futuras modificaciones.
