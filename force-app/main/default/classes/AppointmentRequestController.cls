/**
 * Component: AppointmentRequestController
 * Description: Controlador Apex para gestionar las solicitudes de citas médicas en Salesforce.
 * Author: David Rivas
 * Date: 08-01-24
 * Version: 1.0
 */
public with sharing class AppointmentRequestController {
    /**
     * Method: checkAndCreateContactLead
     * Description: Checks the existence of a Lead or Contact with the provided email.
     *              If not found, creates a new Contact and returns its Id.
     * Parameters:
     *   - email (String): Customer's email address.
     *   - name (String): Customer's full name.
     *   - phone (String): Customer's phone number.
     * Returns: Id of the existing Lead or Contact or the newly created Contact.
     */
    @AuraEnabled
    public static String checkAndCreateContactLead(String email, String name, String phone) {
        String resultMessage;
        String userId = UserInfo.getUserId();
        String delimiter = ' ';
        String firstName = name.substringBefore(delimiter); 
        String lastName = name.substringAfter(delimiter);

        try {
            //Search for an existing Lead with email
            List<Lead> leadList = [SELECT Id FROM Lead WHERE Email =: email LIMIT 1];
            if (leadList.size() > 0) {
                resultMessage = leadList[0].Id;
                return resultMessage;
            }

            //Search for an existing Contact with email 
            List<Contact> contactList = [SELECT Id FROM Contact WHERE Email =: email LIMIT 1];
            if (contactList.size() > 0){
                resultMessage = contactList[0].Id;
                return resultMessage;   
            } 

            //If neither Lead nor Contact is found, create a new Contact
            if (String.isempty(resultMessage)){

                Contact newContact = new Contact(
                    FirstName = firstName, 
                    LastName = lastName,
                    OwnerId = userId,
                    Email = email,
                    Phone = phone
                );
                insert newContact;
                resultMessage = newContact.Id;
            }
        } catch (Exception e) {
            resultMessage = 'Error: ' + e.getMessage();
        }
        return resultMessage;
    }
    /**
     * Method: createEvent
     * Description: Creates a new medical appointment event in Salesforce.
     * Parameters:
     *   - contactId (String): Id of the Contact associated with the appointment.
     *   - selectedDate (Date): Selected date for the appointment.
     *   - selectedCenter (String): Selected medical center for the appointment.
     *   - selectedSpecialist (String): Selected specialist for the appointment.
     *   - selectedTime (String): Selected time for the appointment.
     *   - email (String): Customer's email address.
     *   - name (String): Customer's full name.
     *   - phone (String): Customer's phone number.
     *   - comment (String): Additional comments or observations.
     * Returns: Id of the newly created appointment event.
     */
    @AuraEnabled
    public static String createEvent(String contactId, Date selectedDate, String selectedCenter, String selectedSpecialist, String selectedTime, String email, String name, String phone, String comment) {

        String userId = UserInfo.getUserId();
        String subject = 'Medical appointment at the center: ' + selectedCenter + ' With the specialist: ' + selectedSpecialist;
        String delimiter = ':';
        String hours = selectedTime.substringBefore(delimiter); 
        String minutes1 = selectedTime.substringAfter(delimiter);
        String minutes2 = minutes1.substringBefore(delimiter);
        Time timeChange = Time.newInstance( Integer.valueOf(hours),Integer.valueOf(minutes2),0,0);    
        DateTime cita = DateTime.newInstance(selectedDate, timeChange);
        String resultMessage;
        
        try {
            Event newEvent = new Event();
            newEvent.OwnerId = userId;
            newEvent.Description = comment;
            newEvent.Center__c = selectedCenter;
            newEvent.Specialist__c = selectedSpecialist;
            newEvent.ActivityDate = selectedDate;
            newEvent.ActivityDateTime = cita;
            newEvent.StartDateTime = cita;
            newEvent.EndDateTime  = cita;
            newEvent.Subject = subject;

            insert newEvent;
            resultMessage = newEvent.Id;
        } catch (Exception e) {
            resultMessage = 'Error: ' + e.getMessage();
        }
        return resultMessage;
    }
}