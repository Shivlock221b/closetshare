# ClosetShare User Flow Chart

## Application Overview
ClosetShare is a peer-to-peer fashion rental platform with three user types:
1. **Renter (User)** - Browses and rents outfits
2. **Curator** - Lists outfits for rental
3. **Admin** - Platform management

---

## 🔐 Authentication Flow

```
[Landing Page] → [Header Sign In Button] → [Google OAuth] → [/loggedIn callback]
                                                                    ↓
                                              [Redirect to previous page or /dashboard/curator]
```

**Pages involved:**
- `/` - Home page
- `/loggedIn` - OAuth callback handler

---

## 👗 Renter (User) Flows

### Flow 1: Browse & Discover
```
[Home /] → [Browse Closets Button] → [/closets] → [Click Closet Card]
                                                        ↓
                                                  [/c/[slug]]
                                                        ↓
                                            [Click Outfit Card] → [/outfit/[id]]
```

### Flow 2: Rent an Outfit
```
[/outfit/[id]] → [Select Dates] → [Click "Rent Now"]
                                        ↓
                              [/checkout/[id]?dates]
                                        ↓
                              [Fill Delivery Address]
                                        ↓
                              [Pay via Razorpay]
                                        ↓
                        [Redirect to /order-status/[rentalId]]
```

### Flow 3: Track Order
```
[/orders] → [Click Order Card] → [/order-status/[rentalId]]
                                          ↓
                          [View Timeline, Do QC, Report Issues]
```

### Flow 4: Delivery QC (30 min window after delivery)
```
[/order-status/[rentalId]] → [Status = "delivered"]
                                     ↓
                          [QC Form: Items OK? Size OK?]
                                     ↓
                Either:  [All OK → Status = "in_use"]
                    Or:  [Issue → Status = "disputed"]
```

### Flow 5: Cart Flow
```
[/outfit/[id]] → [Add to Cart] → [/cart]
                                    ↓
                          [View Cart Items]
                                    ↓
                          [Checkout Individual Items]
```

---

## 👔 Curator Flows

### Flow 6: Curator Onboarding
```
[Home /] → [Become a Curator] → [Sign In]
                                    ↓
                        [/dashboard/curator] (Dashboard)
                                    ↓
                        [Set up Profile in Settings]
                                    ↓
                        [/dashboard/curator/settings]
```

### Flow 7: Add Outfit
```
[/dashboard/curator] → [Visit Closet] → [/dashboard/curator/closet]
                                                  ↓
                                        [Add Outfit Button]
                                                  ↓
                                    [/dashboard/curator/closet/add]
                                                  ↓
                                    [Fill Form: Title, Description, Images, Price]
                                                  ↓
                                    [Submit → Redirect to Closet]
```

### Flow 8: Edit Outfit
```
[/dashboard/curator/closet] → [Click Edit on Outfit]
                                        ↓
                            [/dashboard/curator/closet/edit/[id]]
                                        ↓
                            [Update Details → Save]
```

### Flow 9: Manage Rental Requests
```
[/dashboard/curator] → [View Requests] → [/dashboard/curator/requests]
                                                    ↓
                                    [Accept or Reject Request]
                                                    ↓
                                    [If Accepted → Ship & Update Tracking]
```

### Flow 10: Track In-Progress Rentals
```
[/dashboard/curator] → [In-Progress] → [/dashboard/curator/in-progress]
                                                ↓
                                [View Active Rentals]
                                                ↓
                                [Mark as Shipped/Returned]
```

### Flow 11: Return QC (after outfit returned)
```
[/dashboard/curator/in-progress] → [Status = "return_delivered"]
                                            ↓
                                    [Do Return QC]
                                            ↓
        Either:  [All OK → Refund Deposit → Status = "completed"]
            Or:  [Damage → Keep Deposit → Status = "completed" or "disputed"]
```

### Flow 12: Update Profile & Closet URL
```
[/dashboard/curator] → [Settings] → [/dashboard/curator/settings]
                                            ↓
                                    [Update Bio, Photo, Instagram]
                                            ↓
                                    [Set Custom Closet URL (slug)]
                                            ↓
                                    [Save → Closet now at /c/[slug]]
```

---

## 🛡️ Admin Flows

### Flow 13: Admin Portal Access
```
[/ctrl-panel-x7k9] → [Enter Passcode] → [Dashboard]
```

### Flow 14: Manage Rentals
```
[Admin Portal] → [Rentals Tab]
                      ↓
        [View All Rentals] → [Update Status with Note/Link]
                      ↓
        [View/Edit Timeline Entries]
```

### Flow 15: Manage Issues
```
[Admin Portal] → [Issues Tab]
                      ↓
        [View Disputed Rentals]
                      ↓
        [See Issue Reports with Photos]
                      ↓
        [Resolve Issue → Update Status]
```

### Flow 16: Overview & Stats
```
[Admin Portal] → [Overview Tab]
                      ↓
        [View: Total Rentals, Revenue, Active Rentals, Issues]
```

---

## 📊 Complete Page Map

| Route | Purpose | User Type |
|-------|---------|-----------|
| `/` | Landing page | All |
| `/closets` | Browse all curators | All |
| `/c/[slug]` | Curator's closet page | All |
| `/outfit/[id]` | Outfit detail & booking | All |
| `/cart` | Shopping cart | User |
| `/checkout/[id]` | Payment flow | User |
| `/orders` | User's rental history | User |
| `/order-status/[rentalId]` | Rental tracking & QC | User/Curator |
| `/loggedIn` | OAuth callback | All |
| `/dashboard/curator` | Curator dashboard | Curator |
| `/dashboard/curator/closet` | Manage closet | Curator |
| `/dashboard/curator/closet/add` | Add outfit | Curator |
| `/dashboard/curator/closet/edit/[id]` | Edit outfit | Curator |
| `/dashboard/curator/requests` | Rental requests | Curator |
| `/dashboard/curator/in-progress` | Active rentals | Curator |
| `/dashboard/curator/settings` | Profile settings | Curator |
| `/ctrl-panel-x7k9` | Admin portal | Admin |

---

## 🔄 Rental Status Flow

```
requested → paid → accepted → shipped → delivered → in_use → return_shipped → return_delivered → completed
     ↓        ↓        ↓                    ↓                      ↓                 ↓
  rejected  cancelled cancelled         disputed              disputed          disputed
```

---

## Test Checklist

### Authentication
- [ ] Google Sign In works
- [ ] Sign Out works
- [ ] Protected routes redirect to sign in

### Renter Flow
- [ ] Can browse closets
- [ ] Can view outfit details
- [ ] Date picker works correctly
- [ ] Checkout flow completes
- [ ] Payment processes successfully
- [ ] Order appears in /orders
- [ ] Order status page loads
- [ ] Delivery QC form works
- [ ] Issue reporting works

### Curator Flow
- [ ] Dashboard loads with stats
- [ ] Can add new outfit with images
- [ ] Can edit existing outfit
- [ ] Rental requests appear
- [ ] Can accept/reject requests
- [ ] Can update tracking info
- [ ] Return QC works
- [ ] Settings save correctly
- [ ] Custom slug works

### Admin Flow
- [ ] Passcode authentication works
- [ ] All tabs display data
- [ ] Can update rental status
- [ ] Can add notes with links
- [ ] Issues tab shows disputed rentals
- [ ] Can resolve issues
