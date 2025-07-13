# Send to Cookbook Feature - Architecture & Implementation Plan

## 🏗️ Architecture

### **Event-Driven Data Transfer Pattern**
```
Demo App → [Fetch + Package Data] → Pub/Sub → Cookbook Function → Cookbook Storage
```

### **Service Boundaries**
- **Demo App**: Owns its data, packages complete recipe with signed image URLs
- **Pub/Sub**: Event transport layer (Google Cloud)
- **Cookbook**: Receives complete data, transforms and stores in its own systems

### **Data Flow**
1. **Demo**: User clicks "Send to Cookbook"
2. **Demo**: Fetches complete recipe + generates 24h signed URLs for images
3. **Demo**: Publishes event with complete recipe data to Pub/Sub
4. **Cookbook**: Receives event, downloads images, transforms data, stores recipe
5. **Cookbook**: Recipe appears in pending approval queue

### **Message Schema**
```json
{
  "type": "recipe-transfer-requested",
  "recipeData": { /* complete recipe object */ },
  "images": [
    {
      "filename": "image1.jpg", 
      "downloadUrl": "https://supabase-signed-url",
      "expiresAt": "2025-01-13T10:00:00Z"
    }
  ],
  "metadata": {
    "userId": "user-123",
    "userEmail": "user@email.com", 
    "sourceType": "url",
    "timestamp": "2025-01-12T15:30:00Z"
  }
}
```

## 📋 Implementation Plan

### **Phase 1: Infrastructure Setup (Week 1)**

**1.1 Google Cloud Pub/Sub Setup**
- Create `recipe-transfers` topic and `cookbook-transfers` subscription
- Set up service account for demo app with publisher permissions
- Configure dead letter queue for failed messages

**1.2 Cookbook Firebase Function**
- Create `processRecipeTransfer` function triggered by Pub/Sub messages
- Configure function with increased timeout (5 minutes) and memory (1GB) for image processing
- Set up error handling with automatic retries

**1.3 Environment Configuration**
- Demo app: Add Google Cloud project ID and service account key
- Cookbook: No external service configuration needed

### **Phase 2: Demo App Integration (Week 1.5)**

**2.1 Transfer Service**
- Install `@google-cloud/pubsub` in demo app
- Create `CookbookTransferService` class to handle recipe packaging and publishing
- Implement signed URL generation for recipe images (24-hour expiry)

**2.2 UI Components**
- Create `TransferButton` component for single recipe transfer
- Add cookbook icon/branding to transfer button
- Show button only to authenticated users

**2.3 Data Packaging**
- Fetch complete recipe data from demo's Supabase
- Generate signed URLs for all recipe images
- Package everything into Pub/Sub message format

### **Phase 3: Cookbook Processing (Week 2)**

**3.1 Data Transformation**
- Create schema mapping service (demo format → cookbook format)
- Handle field transformations (cook_time → waitTime, category mapping, etc.)
- Add transfer metadata (source, confidence score, etc.)

**3.2 Image Transfer**
- Download images from signed URLs provided by demo
- Upload to Firebase Storage with cookbook's naming convention
- Generate `pendingImages` array for admin approval workflow

**3.3 Recipe Storage**
- Save transformed recipe to Firestore with `approved: false`
- Ensure recipe enters existing admin approval workflow
- Add transfer source tracking for admin interface

### **Phase 4: Enhanced Features (Week 2.5)**

**4.1 Batch Transfer**
- Create `BatchTransferButton` component for multiple recipe selection
- Implement progress tracking for batch operations
- Add transfer summary and error reporting

**4.2 User Feedback**
- Toast notifications for transfer success/failure
- Progress modal for batch transfers
- Error handling with user-friendly messages

### **Phase 5: Testing & Deployment (Week 3)**

**5.1 Integration Testing**
- Test complete flow with real recipes and images
- Verify data transformation accuracy
- Test error scenarios (invalid images, network failures)

**5.2 Performance Testing**
- Test with large images and multiple concurrent transfers
- Verify function timeout and memory usage
- Test batch transfer performance

**5.3 Production Deployment**
- Deploy cookbook function to production
- Deploy demo app with production Pub/Sub configuration
- Set up monitoring and alerting

### **Technical Requirements**

**Demo App Dependencies:**
- `@google-cloud/pubsub` for message publishing
- Service account key for Google Cloud authentication

**Cookbook Dependencies:**
- Firebase Functions v2 with Pub/Sub triggers
- No external service dependencies (receives complete data)

**Infrastructure:**
- Google Cloud Pub/Sub topic and subscription
- Service account with minimal publisher permissions
- Firebase Storage for transferred images

### **Security Considerations**

**Demo App:**
- Service account with pub/sub publisher role only
- Signed URLs with 24-hour expiry for temporary image access
- No cookbook credentials stored in demo

**Cookbook:**
- No external service access required
- Standard Firebase security rules apply
- Images downloaded from temporary signed URLs only

### **Monitoring & Alerting**

**Key Metrics:**
- Transfer success rate (target: >95%)
- Function execution time (target: <2 minutes average)
- Image transfer success rate
- Message queue depth

**Alerts:**
- High error rate in transfers
- Function timeouts or memory issues
- Dead letter queue accumulation

This architecture maintains proper service boundaries while enabling reliable recipe transfers through event-driven communication.