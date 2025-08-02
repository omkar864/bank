# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Firestore Security Rules Setup

To ensure the application functions correctly, you must update your Firestore security rules. The default rules are too restrictive.

**How to update rules:**

1.  Go to your [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`shagunam-c0d63`).
3.  Navigate to **Build > Firestore Database**.
4.  Click on the **Rules** tab.
5.  Replace the existing rules with the content below and click **Publish**.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone with your Firestore database reference to view, edit,
    // and delete all data in your Firestore database. It is useful for getting
    // started, but it is configured to expire after 30 days because it
    // leaves your app open to attackers. At that time, all client
    // requests to your Firestore database will be denied.
    //
    // Make sure to write security rules for your app before that time, or else
    // all client requests to your Firestore database will be denied until you Update
    // your rules
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 8, 8);
    }
  }
}
```

---

## **Critical IAM Permission Setup for Admin Features**

If you encounter an "internal" error when trying to grant admin permissions for the first time, it's likely because your project's service account is missing a required permission.

**How to Fix:**

1.  **Open Google Cloud Console:** Navigate to the [IAM page](https://console.cloud.google.com/iam-admin/iam) for your project (`shagunam-c0d63`).

2.  **Find the Service Account:** Locate the principal (service account) that looks like **`shagunam-c0d63@appspot.gserviceaccount.com`**. This is the default service account for App Engine and Cloud Functions.

3.  **Edit Permissions:** Click the pencil icon (Edit principal) on the right side of that row.

4.  **Add Role:** In the "Edit access" pane that appears, click **+ ADD ANOTHER ROLE**.

5.  **Select Role:** In the "Select a role" dropdown, type `Service Account Token Creator` and select the role from the list.

6.  **Save:** Click **SAVE**.

After saving, wait a minute for the changes to take effect. Then, return to the application, sign out and sign back in, and try clicking the "Grant Admin Permissions" button again. The "internal" error should now be resolved.

    
