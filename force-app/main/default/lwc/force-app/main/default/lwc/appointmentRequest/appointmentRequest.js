/**
 * Component: AppointmentModule
 * Description: Componente Lightning Web para gestionar la solicitud de citas médicas.
 * Author: David Rivas
 * Date: 08-01-24
 * Version: 1.0
 */
import { LightningElement, track, wire, api } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import checkAndCreateContactLead from '@salesforce/apex/AppointmentRequestController.checkAndCreateContactLead';
import createEvent from '@salesforce/apex/AppointmentRequestController.createEvent';
import APPOINTMENT_OBJECT from '@salesforce/schema/Appointment__c';
import SPECIALIST_FIELD from '@salesforce/schema/Appointment__c.Specialist__c';
import CLINIC_FIELD from '@salesforce/schema/Appointment__c.Clinic__c';

export default class DependentPicklistAccount extends LightningElement {
    //tracks for layouts
    @track showDateSelection = true;
    @track showTimeSlots= false;
    @track showContactInfo= false;
    @track showSummary= false;

    //tracks for DateSelection (first layout)
    @track specialistFielData;
    @track specialistOptions;
    @track clinicOptions;
    @track selectedDate;
    @track selectedCenter;
    @track selectedSpecialist;
    @track today = new Date().toISOString().slice(0,10);

    //tracks for timeselection(second layout)
    @track selectedTime;

    //tracks for contactInfo (third layout)
    @track email;
    @track name;
    @track phone;
    @track contactInfo = {
        name: '',
        email: '',
        phone: '',
        comments: ''
    };
    @track contactId;
    @track resultMessage;
    @track comment;

    //-------------------FIRST SCREEN-----------------------------
    @wire(getObjectInfo, {objectApiName: APPOINTMENT_OBJECT})
    appointmentInfo;

    @wire(getPicklistValues, {recordTypeId: '$appointmentInfo.data.defaultRecordTypeId', fieldApiName: SPECIALIST_FIELD  })
    specialistFieldInfo({ data, error }) {
        if (data) this.specialistFielData  = data;
    }

    @wire(getPicklistValues, {recordTypeId:'$appointmentInfo.data.defaultRecordTypeId', fieldApiName: CLINIC_FIELD })
    clinicFieldInfo({ data, error }) {
        if (data) this.clinicOptions  = data.values;
    }

    handleClinicChange(event) {
        let key = this.specialistFielData.controllerValues[event.target.value];
        this.specialistOptions = this.specialistFielData.values.filter(opt => opt.validFor.includes(key));
        this.selectedCenter = event.target.value;
    }

    handleSpecialistChange(event){
        this.selectedSpecialist = event.target.value;
    }
    
    handleDateChange(event) {
        this.selectedDate = event.target.value;
    }
    
    //-------------------SECOND SCREEN-----------------------------
    handleTimeChange(event) {
        this.selectedTime = event.target.value;
    }

    //------------------THIRD SCREEN----------------------------------
    handleNameChange(event) {
        this.contactInfo.name = event.target.value;
        this.name = event.target.value;
    }
    handleEmailChange(event) {
        this.contactInfo.email = event.target.value;
        this.email = event.target.value;
    }
    handlePhoneChange(event) {
        this.contactInfo.phone = event.target.value;
        this.phone = event.target.value;
    }
    handleCommentsChange(event) {
        this.contactInfo.comments = event.target.value;
        this.comment = event.target.value
    }

    //---------------------fourth layout----------------------------------
    handleFinalSubmit(event) {
        this.error = undefined;
        checkAndCreateContactLead({ email: this.email, name: this.name, phone: this.phone })
            .then(result => {
                if(result){
                    this.contactId = result;
                    return createEvent({contactId: this.contactId, selectedDate: this.selectedDate, selectedCenter: this.selectedCenter, selectedSpecialist: this.selectedSpecialist, selectedTime: this.selectedTime, email: this.email, name: this.name, phone: this.phone, comment: this.comment});
                }
            })
            .then(result => {
                const toastEvent = new ShowToastEvent({
                    title: 'Success',
                    message: 'Appointment created successfull',
                    variant: 'success',
                });
                this.dispatchEvent(toastEvent);
                console.log('Successfully created event:', result);
            })
            .catch(error => {
                console.error('Error:', error);
                this.handleErrorMessage(error);
            });
    }
    // Function to handle errors consistently
    handleErrorMessage(error) {
        let errorMessage = 'Error processing the request.';
    
        if (error && error.body) {
            errorMessage = error.body.message || 'Error message not available';
        }
        this.resultMessage = errorMessage;

        const toastEvent = new ShowToastEvent({
            title: 'Error',
            message: 'An error occurred while creating the appointment: ' + errorMessage,
            variant: 'error',
        });
        this.dispatchEvent(toastEvent);
    }

    //Handler to manage all the next button
    handleNext() {
        let showToast = false;
        let toastTitle = 'Error';
        let toastMessage = 'Something went wrong.';
        
        if (this.showDateSelection) {
			// Validations for the first screen
            if (!this.selectedDate || !this.selectedCenter || !this.selectedSpecialist) {
                showToast = true;
                toastMessage = 'Please complete all fields';
            } else {
				this.showDateSelection = false;
				this.showTimeSlots = true;
            }
        } else if (this.showTimeSlots) {
            // Validations for the second screen
            if (!this.selectedTime) {
                showToast = true;
                toastMessage = 'Please complete the time field';
            } else {
				this.showTimeSlots = false;
				this.showContactInfo = true;
            }
        } else if (this.showContactInfo) {	
            // Validations for the third screen
			if (!this.contactInfo.name || !this.contactInfo.email || !this.contactInfo.phone || !this.contactInfo.comments) {
				showToast = true;
				toastMessage = 'Please complete all contact information';
			} else {
				this.showContactInfo = false;
				this.showSummary = true;
            }
        }

        if (showToast) {
            this.showToast(toastTitle, toastMessage, 'error');
        }
    }
    //Toast for the handleNext method
	showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(toastEvent);
    }

    //Handler to manage all the back button
    handleBack() {
        if (this.showTimeSlots) {
            this.selectedDate = undefined;
            this.selectedCenter = undefined;
            this.selectedSpecialist = undefined;
            this.selectedTime = undefined;
            this.showTimeSlots = false;
            this.showDateSelection = true;
        } else if (this.showContactInfo) {
            this.selectedTime = undefined;
            this.showContactInfo = false;
            this.showTimeSlots = true;
        } else if (this.showSummary) {
            this.contactInfo.name = undefined;
            this.contactInfo.email = undefined;
            this.contactInfo.phone = undefined;
            this.contactInfo.comments = undefined;
            this.showSummary = false;
            this.showContactInfo = true;
        }
    }
}