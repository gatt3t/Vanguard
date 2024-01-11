public with sharing class CitaController {
    @AuraEnabled
    public static void crearEvento(String fechaCita, String horaCita, String centro, String especialidad) {
        Event nuevoEvento = new Event(
            Subject = 'Cita de ' + especialidad,
            StartDateTime = DateTime.valueOf(fechaCita + ' ' + horaCita),
            EndDateTime = DateTime.valueOf(fechaCita + ' ' + horaCita).addHours(1), // Duración de 1 hora, ajusta según sea necesario
            Location = centro,
            Description = 'Cita para ' + especialidad
        );

        insert nuevoEvento;
    }
}