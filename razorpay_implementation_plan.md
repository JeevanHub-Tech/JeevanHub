# Razorpay Split Payment Implementation Plan

This plan details how to manage payments where a patient pays a lump sum into the company account, and the funds are then split and distributed to the respective vendors (retailers) based on the items purchased. We will use **Razorpay Route**, which is specifically designed for this use case.

---

## How Linked Accounts Work (Answering Your Questions)

### 1. Who creates them?
**You (the platform/backend)** create them. When a retailer signs up on your website/app, your backend server makes an API call to Razorpay (the `POST /beta/accounts` API) containing the retailer's basic details (name, email, phone). 

### 2. Are they stored in the database?
**Yes.** When your backend calls Razorpay to create the linked account, Razorpay returns a unique ID like `acc_Fh12xVq34yZ`. You must save this `account_id` in your own database, directly inside the `Retailer` or `Vendor` table/model.

### 3. How are they maintained for the next time?
Because you saved `acc_Fh12xVq34yZ` in your database, you don't need to create the account again. 
When a patient buys from that retailer in the future, your system looks up the retailer in your database, grabs their `acc_...` ID, and tells Razorpay: *"Transfer ₹500 from my company account to `acc_Fh12xVq34yZ`"*.

---

## Step-by-step Implementation

### 1. Database Schema Updates
To calculate how much each retailer gets, we need strict tracking of order items and vendor accounts.

*   **Vendor/Retailer Model**: Add a new column/field `razorpay_account_id` (String) to store their linked account ID from Razorpay.
*   **Order/Cart Model**: Ensure every `OrderItem` clearly references the `VendorID`.
*   **Transfer Log Model (New)**: Create a table to log all transfers made to vendors for reconciliation and debugging.

### 2. Calculating the Split Amount
When a patient places an order, the backend will calculate the split:
1.  **Group Items by Vendor**: Loop through the patient's cart and group items by the vendor they belong to.
2.  **Calculate Subtotals**: Calculate the total amount owed to Vendor A, Vendor B, etc.
3.  **Deduct Commission**: Subtract the company's commission/platform fee from each vendor's subtotal.
4.  **Final Transfer Amount**: The remaining amount is what will be transferred to each respective vendor.

### 3. Payment Flow & Razorpay Integration

We will use the **Direct Transfer** method using Razorpay Route.

1.  **Patient Checkout**:
    *   Patient proceeds to checkout (e.g., Total ₹1000).
    *   Backend creates a standard Razorpay `Order` for ₹1000.
2.  **Payment Capture**:
    *   Patient pays via UPI/Card.
    *   The ₹1000 lands directly in the **Company's Razorpay Account**.
3.  **Triggering the Transfer (The Split)**:
    *   Listen to the `payment.captured` webhook from Razorpay.
    *   Once captured, the backend executes the calculation logic (from Step 2).
    *   The backend retrieves the `razorpay_account_id` for each vendor from your database.
    *   The backend calls the **Razorpay Transfers API** to move the calculated amounts to the vendors.
    
    *Example API Payload for Transfer*:
    ```json
    {
      "transfers": [
        {
          "account": "acc_VendorA123", // Looked up from your DB
          "amount": 40000, // Amount in paise (₹400)
          "currency": "INR",
          "notes": { "order_id": "ord_123" }
        },
        {
          "account": "acc_VendorB456", // Looked up from your DB
          "amount": 50000, // Amount in paise (₹500)
          "currency": "INR",
          "notes": { "order_id": "ord_123" }
        }
      ]
    }
    ```
    *Note: The remaining ₹100 (1000 - 400 - 500) automatically stays in your Company account as your platform fee.*
