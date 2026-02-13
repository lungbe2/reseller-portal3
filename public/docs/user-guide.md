# Reseller Portal - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Reseller Portal](#reseller-portal)
4. [Admin Portal](#admin-portal)
5. [Commission System](#commission-system)
6. [Organizations](#organizations)
7. [Frequently Asked Questions](#frequently-asked-questions)
8. [Support](#support)

---

## Introduction

Welcome to the Reseller Portal! This platform enables resellers to manage customers, track commissions, and access comprehensive analytics. Administrators can manage the entire system, including users, commissions, organizations, and system settings.

### Key Features

#### For Resellers:
- 👥 Customer management (add, edit, view)
- 💰 Commission tracking and requests
- 📊 Analytics and reporting
- 📄 Document management
- 🔔 Notifications and updates
- 🏢 Organization membership

#### For Administrators:
- 👤 User management with commission settings
- ✅ Commission approval and payment tracking
- 📈 System-wide analytics
- 🔍 Audit logs and activity monitoring
- ⚙️ Automated approval rules
- 🏢 Organization management
- 📋 Deal closing and contract management

---

## Getting Started

### 1. Logging In

1. Go to the login page: `https://reseller.medici-holding.abacus.ai`
2. Enter your email address and password
3. Click **"Login"**
4. You will be automatically redirected to your dashboard (Reseller or Admin)

#### Default Credentials:

**Admin Account:**
- Email: `john@doe.com`
- Password: `johndoe123`

**Imported Resellers:**
- Use your registered email address
- Default password: `Reseller2025$`

### 2. Forgot Password

1. Click **"Forgot Password?"** on the login page
2. Enter your email address
3. Follow the instructions in the email to reset your password

### 3. Change Language

The portal supports Dutch and English:

1. Click on the language selector (🌐) in the navigation bar
2. Select your preferred language
3. The interface will update immediately

---

## Reseller Portal

### Dashboard

The dashboard provides an overview of:
- **Total Customers**: Number of registered customers
- **Total Leads**: Number of potential customers
- **Total Commission**: Cumulative earned commission
- **Recent Customers**: List of recently added customers

### Customer Management

#### Add a New Customer

1. Navigate to **"Customers"** in the sidebar menu
2. Click **"New Customer"**
3. Fill in the form:
   - **Company Name**: Name of the customer company
   - **Contact Person**: Name of the contact person
   - **Email**: Email address
   - **Phone**: Phone number
   - **Website Domain**: Customer's website
   - **Review Platform**: Kiyoh or Klantenvertellen
   - **Status**: Choose Lead, Active, or No Deal
4. Click **"Register Customer"**

#### Edit a Customer

Resellers can edit limited customer information:

1. Navigate to **"Customers"**
2. Click on a customer row or the **"Edit"** button
3. Editable fields:
   - Contact Name
   - Email
   - Phone
   - Address, City, Postal Code, Country
4. Click **"Save"** to update

**Note:** Company name and status can only be changed by administrators.

#### Search and Filter Customers

- **Search**: Type in the search bar to search by name, company, or email
- **Filter by status**: Use the dropdown to filter by:
  - All
  - Active
  - Lead
  - No Deal

### Commissions

View your earned commissions:

1. Navigate to **"Commissions"** in the sidebar
2. View commission history with:
   - Customer name
   - Amount
   - Status (Pending, Approved, Paid, Contract Ended)
   - Period/Year
3. Use filters to view by status or time period

### Documents

1. Navigate to **"Documents"**
2. View shared documents from administrators
3. Upload your own documents
4. Download documents as needed

### Analytics

Access detailed analytics:

1. Navigate to **"Analytics"**
2. View:
   - Revenue trends (12-month chart)
   - Commission status breakdown
   - Customer status distribution
   - Top 5 customers
3. Export data to CSV

---

## Admin Portal

### Dashboard

The admin dashboard shows:
- **Total Resellers**: Number of active reseller partners
- **Leads**: Customers with LEAD status
- **Active Customers**: Customers with ACTIVE status
- **Total Commissions**: Sum of all commissions

Click on any card to view filtered details.

### Reseller Management

#### View Resellers

1. Navigate to **"Resellers"**
2. Click on any row to view reseller details
3. View:
   - Contact information
   - Commission settings (rate, years, one-off payment)
   - Customer list
   - Commission history
   - Notes

#### Add a New Reseller

1. Navigate to **"User Management"**
2. Click **"Add User"**
3. Fill in:
   - Name, Email, Company (required)
   - Phone, Address, Website
   - Role: Select "Reseller"
   - **Commission Rate**: Percentage (default 20%)
   - **Commission Years**: Number of years (default 3, use 100 for lifetime)
   - **One-Off Payment**: Check for single payment instead of annual
4. Click **"Create User"**

### Customer Management

#### View All Customers

1. Navigate to **"Customers"**
2. Click on any row to view customer details
3. Filter by status using the dropdown

#### Close a Deal

When a lead becomes a paying customer:

1. Navigate to the customer detail page
2. Click **"Close Deal"**
3. Enter:
   - **Contract Value**: Total contract amount
   - **Contract Duration**: Length in months
4. Click **"Confirm"**

This automatically:
- Changes customer status to ACTIVE
- Creates commission entries based on reseller settings
- Notifies the reseller

#### End a Contract

When a customer cancels:

1. Navigate to the customer detail page (must be ACTIVE)
2. Click **"End Contract"**
3. Confirm the action

This automatically:
- Changes customer status to NO_DEAL
- Updates all pending/approved commissions to CONTRACT_ENDED
- Stops future commission payments

### Commission Management

#### View Commissions

1. Navigate to **"Commissions"**
2. View all commissions across resellers
3. Filter by:
   - Status (Pending, Approved, Paid, Rejected, Contract Ended)
   - Period

#### Approve/Reject Commissions

1. Find a PENDING commission
2. Click the **checkmark (✓)** to approve
3. Click the **X** to reject
4. Approved commissions can be marked as PAID using the **"$ Pay"** button

#### Export Statement

Click **"Export Statement"** to download a CSV of commissions.

### User Management

#### Edit User Settings

1. Navigate to **"User Management"**
2. Click on a user to edit
3. Modify:
   - Basic information
   - Commission settings:
     - **Commission Rate**: 0-100%
     - **Commission Years**: 1-100 (100 = lifetime)
     - **One-Off Payment**: Single payment option
4. Click **"Save Changes"**

#### Reset Password

1. Click **"Reset Password"** on user detail page
2. A temporary password will be generated
3. User will receive email with new credentials

---

## Commission System

### How Commissions Work

1. **Commission Rate**: Percentage of contract value (set per reseller)
2. **Commission Years**: How many years commissions are paid
3. **One-Off Payment**: Option for single payment instead of annual

### Commission Calculation Example

**Annual Payment:**
- Contract Value: €10,000
- Commission Rate: 20%
- Commission Years: 3
- Annual Commission: €10,000 × 20% = €2,000/year
- Total over 3 years: €6,000

**One-Off Payment:**
- Contract Value: €10,000
- Commission Rate: 20%
- Commission Years: 3
- One-Time Commission: €10,000 × 20% × 3 = €6,000 (paid once)

### Commission Statuses

| Status | Description |
|--------|-------------|
| PENDING | Awaiting admin approval |
| APPROVED | Approved, awaiting payment |
| PAID | Payment completed |
| REJECTED | Commission rejected |
| CONTRACT_ENDED | Contract cancelled, no payment |

---

## Organizations

Organizations allow multiple users to work together under one reseller entity.

### For Administrators

#### Create an Organization

1. Navigate to **"Organizations"**
2. Click **"New Organization"**
3. Fill in:
   - Organization Name
   - Contact Email
   - Phone
   - Commission Settings (rate, years, one-off)
4. Click **"Create Organization"**

#### Manage Team Members

1. Click on an organization
2. In the **"Team Members"** section:
   - Click **"Add Member"** to add existing reseller users
   - Change member roles: Owner, Manager, Member
   - Remove members as needed

### Organization Roles

| Role | Permissions |
|------|-------------|
| Owner | Full access, manage members |
| Manager | View all data, limited editing |
| Member | View own data only |

---

## Frequently Asked Questions

### Q: How do I change my password?
A: Use the "Forgot Password" link on the login page, or contact your administrator.

### Q: Why can't I edit the company name?
A: Only administrators can modify company names and status to maintain data integrity.

### Q: What does "100 years" commission mean?
A: This indicates lifetime commission - the reseller receives commission for as long as the customer remains active.

### Q: How is commission calculated for one-off payments?
A: The total commission (rate × years × contract value) is paid in a single payment.

### Q: What happens when a contract ends?
A: All pending and approved commissions change to "Contract Ended" status and no further payments are made.

---

## Support

### Contact Information

For technical support or questions:

- **Email**: support@medici-holding.com
- **Portal**: Use the Contact form in your dashboard

### Documentation

Access documentation from the **"Help"** section in your portal:
- Quick Start Guide (PDF)
- Full User Guide (PDF)
- Available in English and Dutch

---

*Last updated: January 2026*
