# JuaAfya Enterprise Features - Quick Start Guide

## 🚀 Getting Started

This guide walks you through setting up and using all the new enterprise features implemented in JuaAfya.

---

## 📧 Email System (Gmail SMTP)

### Setup

1. **Enable 2-Step Verification** in your Gmail account
   - Go to myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Set Environment Variables** in Supabase Dashboard
   \`\`\`
   GMAIL_SMTP_USER=your-email@gmail.com
   GMAIL_SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (the 16-char app password)
   \`\`\`

### Using Email Features

**Automatic Features:**
- Appointment confirmations (email sent automatically when appointment is created)
- Can be sent manually using `sendEmail()` function in code

**Email Service Functions:**
\`\`\`typescript
import { sendAppointmentConfirmation, sendPasswordResetEmail } from '@/services/emailService'

// Send appointment confirmation
await sendAppointmentConfirmation(
  'patient@example.com',
  'John Doe',
  'Monday, January 15, 2024',
  '02:30 PM',
  'Dr. Smith',
  'Main Clinic'
)
\`\`\`

---

## 💬 SMS Notifications (Twilio)

### Setup

1. **Create Twilio Account** at twilio.com

2. **Get Your Credentials**
   - Account SID
   - Auth Token
   - Twilio Phone Number (the one you'll send from)

3. **Set Environment Variables** in Supabase Dashboard
   \`\`\`
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=+1234567890
   \`\`\`

### Using SMS Features

**Automatic Features:**
- Appointment confirmation SMS (sent when appointment is created if patient has phone number)

**SMS Service Functions:**
\`\`\`typescript
import { sendAppointmentReminderSMS } from '@/services/smsService'

// Send appointment reminder
await sendAppointmentReminderSMS(
  '+254712345678',           // Phone number
  'John Doe',                // Patient name
  'Monday, January 15, 2024',// Date
  '02:30 PM',               // Time
  'Dr. Smith',              // Doctor name
  'Main Clinic'             // Clinic name
)
\`\`\`

**Phone Number Format:**
- Automatically converts local Kenya numbers to international format
- Supports: 0712345678 → +254712345678
- Also accepts: +254712345678, 254712345678

---

## 👤 Admin Settings

### Accessing Admin Settings

1. **Login as Super Admin**
   - Only super_admin users can access settings

2. **Navigate to Admin Dashboard**
   - URL: `/admin`

3. **Go to Settings Tab**
   - Platform Name
   - Support Email
   - Support Phone
   - Logo URL
   - Primary & Secondary Colors
   - Maintenance Mode toggle

### Saving Settings

- All changes are automatically saved to the database
- Settings apply globally across the platform
- Super-admin only access via RLS policies

---

## 📊 Advanced Filtering

### Appointments Page Filters

**Available Filters:**
- **Status**: All, Scheduled, Completed, Cancelled, No-Show
- **Doctor**: Select specific doctor or view all
- **Date Range**: From date and to date
- **Clear All**: Reset all filters

**How to Use:**
1. Navigate to Appointments
2. Adjust filters as needed
3. Filters apply in real-time
4. Click "Clear All" to reset

### Patients Page Filters

**Available Filters:**
- **Search**: By name, MRN, or phone
- **Gender**: All, Male, Female, Other
- **Blood Type**: A+, A-, B+, B-, AB+, AB-, O+, O-
- **Clear All**: Reset all filters

**How to Use:**
1. Navigate to Patients
2. Use search box or dropdowns
3. Combine multiple filters
4. Click "Clear All" to reset

---

## 📈 Patient Demographics Reports

### Viewing Demographics

1. **Navigate to Reports**
2. **Go to Clinical Tab**
3. **View Three Demographic Charts:**
   - **Top Diagnoses**: Most common diagnoses (bar chart)
   - **Gender Distribution**: Male/Female/Other split (pie chart)
   - **Age Distribution**: Patients grouped by age ranges (bar chart)

### Age Groups
- **0-18**: Children
- **19-35**: Young Adults
- **36-50**: Middle Age
- **51-65**: Senior
- **65+**: Elderly

### Features
- Real-time data aggregation
- Based on your current patients
- Updates automatically
- Interactive charts with tooltips

---

## 🔐 Permission System

### User Roles and Permissions

**Super Admin**
- Access to all clinics
- Can create/manage clinics
- Can manage platform settings
- Unlimited permissions

**Admin (Clinic)**
- Full clinic management
- User management
- Settings and billing
- All patient/appointment access

**Doctor**
- View patients and appointments
- Create/edit patient records
- Complete visits
- View inventory
- Access pharmacy

**Nurse**
- View patients and appointments
- Create/edit patient records
- View visits
- View inventory

**Receptionist**
- Create/manage appointments
- View patient info
- Create new patients
- View billing
- Send SMS

**Pharmacist**
- View patients
- Manage inventory
- Dispense medications
- View reports

**Lab Technician**
- View patient records
- Edit visits
- View inventory
- Access reports

### Server-Side Enforcement

All create, update, and delete operations are now protected with:
- User authentication check
- Role-based permission verification
- Clinic-level access control
- Automatic audit logging

---

## 🔍 Server-Side API Endpoints

### Patients API
\`\`\`
GET    /api/patients              - List all patients (with clinic filter)
POST   /api/patients              - Create new patient
PUT    /api/patients/[id]         - Update patient
DELETE /api/patients/[id]         - Delete patient
\`\`\`

### Appointments API
\`\`\`
GET    /api/appointments          - List all appointments
POST   /api/appointments          - Create new appointment
PUT    /api/appointments/[id]     - Update appointment
DELETE /api/appointments/[id]     - Delete appointment
\`\`\`

### Inventory API
\`\`\`
GET    /api/inventory             - List all inventory
POST   /api/inventory             - Create inventory item
PUT    /api/inventory/[id]        - Update inventory item
DELETE /api/inventory/[id]        - Delete inventory item
\`\`\`

### Admin Settings API
\`\`\`
GET    /api/admin/settings        - Fetch current settings
POST   /api/admin/settings        - Save settings
\`\`\`

---

## 🧪 Testing the Features

### Test Email Sending
\`\`\`javascript
// In browser console or component
import { sendEmail } from '@/services/emailService'

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>This is a test</p>'
})
\`\`\`

### Test SMS Sending
\`\`\`javascript
import { sendSMS } from '@/services/smsService'

await sendSMS({
  phone_number: '+254712345678',
  message: 'Test SMS from JuaAfya'
})
\`\`\`

### Test Permissions
\`\`\`javascript
// Try to delete as non-admin user - should fail with 403
fetch('/api/patients/patient-id', {
  method: 'DELETE'
})
// Should return: { error: 'Permission denied: patients.delete' }
\`\`\`

---

## 🐛 Troubleshooting

### Email Not Sending
**Problem**: "Gmail SMTP credentials not configured"
- **Solution**: Verify environment variables are set in Supabase
- Ensure you're using App Password, not regular Gmail password
- Check that 2-Step Verification is enabled

### SMS Not Sending
**Problem**: "SMS service not configured"
- **Solution**: Verify TWILIO_AUTH_TOKEN is set
- Check phone number format (should be +254... for Kenya)
- Verify Twilio account has credits

### Admin Settings Not Saving
**Problem**: "Only super admins can modify settings"
- **Solution**: Ensure you're logged in as super_admin user
- Check user role in database

### Permissions Errors
**Problem**: "Permission denied: [action]"
- **Solution**: Check user role and required permission
- See permission matrix in documentation
- Verify user is assigned to correct clinic

### Charts Not Loading
**Problem**: Demographics charts show "No data available"
- **Solution**: Ensure patients have:
  - Valid date_of_birth
  - Valid gender field
  - Stored in same clinic
- Charts update automatically as data is added

---

## 📋 Daily Operations Checklist

- [ ] Check admin settings are correct
- [ ] Monitor failed emails/SMS in logs
- [ ] Verify appointment reminders are sending
- [ ] Review audit logs for security
- [ ] Check demographics reports for insights
- [ ] Confirm all filters are working
- [ ] Test patient creation and verify emails

---

## 🔗 Useful Resources

- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Twilio Console**: https://www.twilio.com/console
- **Supabase Dashboard**: https://app.supabase.com
- **Email Templates**: See `services/emailService.ts` for examples
- **SMS Templates**: See `services/smsService.ts` for examples

---

## 📞 Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for detailed information
2. Review error messages in browser console
3. Check Supabase logs for edge function errors
4. Verify environment variables are set correctly

---

*Last Updated: 2024*
*All Features Ready to Use*
