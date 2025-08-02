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

If you encounter an "internal" error when trying to delete users or grant admin permissions, it's likely because your project's service account is missing required permissions.

**How to Fix:**

1.  **Open Google Cloud Console:** Navigate to the [IAM page](https://console.cloud.google.com/iam-admin/iam) for your project (`shagunam-c0d63`).

2.  **Find the Service Account:** Locate the principal (service account) that looks like **`shagunam-c0d63@appspot.gserviceaccount.com`**. This is the default service account for App Engine and Cloud Functions.

3.  **Edit Permissions:** Click the pencil icon (Edit principal) on the right side of that row.

4.  **Add Required Roles:** In the "Edit access" pane that appears, click **+ ADD ANOTHER ROLE** and add the following two roles, one by one:
    *   `Service Account Token Creator`: Allows the function to create tokens for other services.
    *   `Firebase Authentication Admin`: Allows the function to create, edit, and **delete** users.

5.  **Save:** Click **SAVE**.

After saving, wait a minute for the changes to take effect. Then, **you must redeploy your functions** for them to pick up the new permissions.

---

## Firebase Functions Deployment

If you are seeing an "internal" error when the application tries to call a backend function, it is likely because your Cloud Functions have not been deployed yet, or they are outdated.

Follow these steps to deploy your functions:

**Prerequisites:**
- You must have the [Firebase CLI](https://firebase.google.com/docs/cli) installed: `npm install -g firebase-tools`
- You must be logged in: `firebase login`

**Deployment Steps:**

1.  **Navigate to the functions directory:**
    Open a new terminal and change the directory to your functions folder.
    ```bash
    cd firebase/functions
    ```

2.  **Install dependencies:**
    The functions have their own dependencies. Install them by running:
    ```bash
    npm install
    ```

3.  **Deploy the functions:**
    From the `firebase/functions` directory, run the deploy script:
    ```bash
    npm run deploy
    ```
    This command will first build your TypeScript code into JavaScript (`npm run build`) and then deploy it.

After deployment is complete, your backend functions will be live and updated. Reload the application, and the "internal" error should be resolved.
