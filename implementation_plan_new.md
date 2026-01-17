# IMPLEMENTATION PLAN - NUGRAHA BENGKEL ENHANCEMENTS

This plan covers the implementation- [x] Planning and Research Phase
- [/] Phase 1: Member & Vehicle Enhancements
- **Database**: Add `member_code`, `vehicle_type` (R2, R3, R4), `vehicle_size` (Kecil, Sedang, Besar, Jumbo), `vehicle_model`, `stnk_photo_url`, and `visit_count` to `members` table.
- **UI**: Update Member Form (Add/Edit) with new fields.
- **Logic**: Auto-generate `member_code` (MBR001...) on registration.

### 2. Dynamic Service Pricing
- **Database**: Update `services` table or create a new `service_prices` table to store prices per `vehicle_type` and `vehicle_size`.
- **UI**: Update Service Form to allow multi-level price settings.
- **POS Logic**: Automatically fetch price based on selected member's vehicle profile.

### 3. Queue Management
- **Database**: New table `queues` (id, queue_number, status, date, member_id).
- **UI**: New "Antrian" page. Dashboard widget for active queue.
- **Logic**: Daily reset of queue numbers (A001...).

### 4. Loyalty Program
- **Database**: New tables `loyalty_programs` (id, name, target_visits, reward_desc, is_active) and `loyalty_claims` (id, member_id, program_id, claimed_at).
- **POS Logic**: Check `visit_count` vs `target_visits` and trigger reward notification.

### 5. Role & Permission System (FINAL STEP)
- **Database**: New tables `user_permissions` (id, user_id, menu_id, can_view, can_create, can_update, can_delete).
- **UI**: New "Kelola Permission" settings page.
- **Logic**: Middleware/Component-level access control.

## SQL Schema Update (Supabase)
I will provide `supabase_schema_update.sql` for these changes.

---
## Progress Tracking
- [ ] Member Enhancements
- [ ] Dynamic Service Pricing
- [ ] Queue Management
- [ ] Loyalty Program
- [ ] Role & Permission System
