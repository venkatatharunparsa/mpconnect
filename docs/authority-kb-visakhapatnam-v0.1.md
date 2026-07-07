# Authority Knowledge Base — Visakhapatnam District (v0.1)
*Phase 0 research output for VGPS/MPconnect — built from live web sources, 2026-07-07*

**Verification legend:** ✅ = verified against a source this session (linked) · ⚠️ = high-confidence but needs primary-source confirmation before entering production KB · Every ⚠️ item is listed in §9 (field verification checklist).

---

## 1. Critical context (why older data is wrong)

- **District reorganization (April 2022):** The old Visakhapatnam district was split into three: **Visakhapatnam**, **Anakapalli**, and **Alluri Sitharama Raju (ASR)** districts. ✅ Any pre-2022 authority data is invalid.
- **Government change (June 2024):** TDP-led NDA government under CM N. Chandrababu Naidu. The previous government's "Spandana" grievance system was **rebranded/reformed as PGRS** (Public Grievance Redressal System). ✅
- Post-split, Visakhapatnam district is **predominantly urban** — most of it falls under GVMC. This means for our pilot, **GVMC is the single most important authority**, not rural line departments.

## 2. Political layer (the pilot's sponsor level)

| Role | Holder | Notes |
|---|---|---|
| MP, Visakhapatnam Lok Sabha | **Sribharat Mathukumili (TDP)**, elected 2024 by ~5 lakh margin; President of GITAM | ✅ Our target pilot sponsor |
| Assembly segments under this LS seat (7) | Srungavarapukota, Bheemili, Visakhapatnam East, Visakhapatnam South, Visakhapatnam North, Visakhapatnam West, Gajuwaka | ✅ Note: Srungavarapukota lies in Vizianagaram district — cross-district jurisdiction complexity for the MP dashboard |
| MLAs (7) | One per segment — names to be pulled from visakhapatnam.ap.gov.in/mlas | ⚠️ |

**Design implication:** the MP's constituency ≠ the district. The KB must model *parliamentary constituency* as a geography overlapping two districts.

## 3. District administration (revenue hierarchy)

```
District Collector & Magistrate (IAS) — Visakhapatnam Collectorate
  ├── Joint Collector
  ├── Revenue Divisional Officer (RDO), Visakhapatnam division
  ├── Revenue Divisional Officer (RDO), Bheemunipatnam division
  │     └── Tahsildar (one per mandal)
  │           └── Revenue Inspector → Village Revenue Officer (VRO)
```

- **2 revenue divisions:** Visakhapatnam and Bheemunipatnam. ✅
- **~11 mandals:** Bheemunipatnam division — Bheemunipatnam, Anandapuram, Padmanabham, Visakhapatnam Rural, Seethammadhara. Visakhapatnam division — Gajuwaka, Pedagantyada, Gopalapatnam, Mulagada, Maharanipeta, Pendurthi. ✅ (sources differ slightly on count — official district site fetch failed this session; recheck exact list ⚠️)
- **Handles:** land records, land disputes, certificates (income/caste/residence), natural-calamity relief, revenue-court matters, overall district coordination. The Collector chairs **Monday PGRS grievance day** at the collectorate. ✅

## 4. Urban local body — GVMC (the workhorse for Vizag problems)

```
Municipal Commissioner (IAS)  ← executive head
  ├── Additional Commissioners
  ├── Zonal Commissioners (zones recently increased 8 → 10) ✅
  │     └── Ward offices (98 wards) ✅
  ├── Engineering Dept (roads, drains, streetlights)
  ├── Public Health & Sanitation Dept (garbage, drains, toilets, mosquito control)
  ├── Water Supply Dept
  ├── Town Planning Dept (illegal construction, layouts)
  └── Revenue Dept (property tax)
Mayor + 98 ward corporators  ← deliberative wing ✅
```

- Jurisdiction ~640–681 km² covering nearly all of urban Visakhapatnam. ✅
- GVMC runs its own complaint portal/app (gvmc.gov.in) — an integration/benchmark target. ✅
- Ward-level: AP's **Ward Secretariat** system puts government functionaries in every ward (see §5).

## 5. Grassroots layer — Village/Ward Secretariats (Sachivalayam)

- System is **active and was rationalized in 2025**: 15,004 secretariats statewide grouped into 7,715 groups; categories A/B/C by population (≤2,500 / 2,501–3,500 / >3,500) with minimum 6/7/8 functionaries respectively. ✅ (GO Ms No. 3 & GO 11, 2025)
- Functionary types: General Purpose (admin), Specific Purpose/Technical (agriculture, health, engineering etc.), Aspirational (community development). ✅
- **This is the natural "last-mile fingertip" of our routing engine** — nearly every citizen-facing service request legally lands at a secretariat first. The per-secretariat functionary job chart (GO 11) is a ready-made routing table. ⚠️ obtain the GO PDF and encode it.

## 6. Line departments & parastatals (problem-category owners)

| Problem category | Primary authority | First contact point | Escalation path |
|---|---|---|---|
| Roads/potholes (urban) | GVMC Engineering | Ward secretariat / GVMC portal | Ward → Zonal Commissioner → Chief Engineer → Commissioner ✅ structure, ⚠️ designations |
| Roads (state highways) | R&B Department | Assistant Engineer (division) | AE → EE → SE → CE ⚠️ |
| Drainage/flooding (urban) | GVMC Engineering + Public Health | Ward secretariat | as above ⚠️ |
| Garbage/sanitation | GVMC Public Health | Ward sanitation staff | Sanitary Inspector → Zonal → Chief Medical Officer of Health ⚠️ |
| Water supply (urban) | GVMC Water Supply wing | Ward secretariat / GVMC | ⚠️ |
| Electricity | **APEPDCL** (Eastern Power Distribution Co., HQ Visakhapatnam) | Fuse-off call center / section office | Lineman → AE → ADE → DE → SE ⚠️ |
| Streetlights | GVMC Engineering (Electrical) | Ward secretariat | ⚠️ |
| Pensions (social security) | Sachivalayam welfare functionary | Ward/Village secretariat | Secretariat → MPDO/Municipal Commissioner → District ⚠️ scheme renamed under new govt — confirm current name |
| Ration card / PDS | Civil Supplies Dept | Ward secretariat | Secretariat → ASO → DSO ⚠️ |
| Land records/disputes | Revenue Dept | VRO / Tahsildar (mandal) | Tahsildar → RDO → Joint Collector → Collector ✅ |
| Certificates (caste/income) | Revenue via Secretariat | Ward/Village secretariat (MeeSeva) | ⚠️ |
| Government hospitals | District Medical & Health Officer; King George Hospital (tertiary) | Hospital superintendent | DMHO → Director of Health ⚠️ |
| Government schools | District Educational Officer (DEO) | Headmaster → Mandal Education Officer | MEO → Dy EO → DEO ⚠️ |
| Police/safety | Visakhapatnam City Police Commissionerate | Local police station / Dial 112 | SHO → ACP → DCP → CP ⚠️ |
| Buses/transport | APSRTC Vizag region | Depot manager | ⚠️ |
| Illegal construction | GVMC Town Planning | Ward secretariat | ⚠️ |
| Pollution (industrial) | APPCB Regional Office, Visakhapatnam | Regional office | ⚠️ |

## 7. Existing grievance channels (what we integrate with / compete against)

| Channel | Operator | Status |
|---|---|---|
| **PGRS** (meekosam.ap.gov.in) — reformed from Spandana; 26 departments, 106 HoDs integrated | AP Govt | ✅ Active. Monday collector grievance day + Friday "Field Grievance Day" ✅ |
| CM-announced dedicated "Praja Darbar"-style platform | AP Govt | ✅ announced; current status ⚠️ |
| **CPGRAMS** (pgportal.gov.in) | GoI | ✅ Active, for central subjects |
| GVMC complaints portal/app | GVMC | ✅ Active |
| 1902 call center | AP Govt | ⚠️ number not confirmed this session |

**Known weakness we exploit:** documented reporting (The Wire) of **delays and false closures** in AP's PGRS — officials marking grievances resolved without actual resolution. Our citizen-confirmation loop is aimed precisely at this. ✅

## 8. Escalation model (draft rules for the engine)

1. **Urban public problem:** Ward Secretariat → GVMC Zonal Commissioner → GVMC dept head → Municipal Commissioner → District Collector → State dept.
2. **Rural public problem:** Village Secretariat → Tahsildar/MPDO → RDO → Collector → State.
3. **Personal entitlement:** Secretariat functionary → mandal/zonal officer → district officer of that department.
4. **Political visibility layer (our differentiator):** any Master Problem unresolved past SLA surfaces on the MLA (segment) and MP (constituency) dashboards regardless of administrative level.

## 9. Field verification checklist (cannot be completed from the web)

1. Exact current mandal list + official district site data (site was down this session).
2. Names/contacts of current RDOs, Tahsildars, GVMC Zonal Commissioners, dept heads (transfers are frequent — needs a refresh process, suggest quarterly + event-driven).
3. GO 11 functionary job chart PDF → encode as routing table.
4. Current names of welfare schemes under the 2024 govt (pension scheme name, etc.).
5. 1902 / current toll-free numbers; status of announced Praja Darbar platform.
6. The 7 current MLAs and their office contacts.
7. GVMC's 10-zone boundaries (ward→zone mapping).
8. All ⚠️ escalation designations — validate with one insider conversation at GVMC + Collectorate.

## 10. Sources

- [Visakhapatnam district — Wikipedia](https://en.wikipedia.org/wiki/Visakhapatnam_district)
- [Visakhapatnam district official site — Mandals](https://visakhapatnam.ap.gov.in/mandals/) *(fetch failed this session — recheck)*
- [Districtsinfo — Visakhapatnam revenue divisions & mandals](https://www.districtsinfo.com/2022/04/visakhapatnam-district-revenue-divisions-mandals.html)
- [Mathukumilli Bharat — Wikipedia](https://en.wikipedia.org/wiki/Mathukumilli_Bharat) · [IndiaVotes 2024 result](https://www.indiavotes.com/lok-sabha/2024/andhra-pradesh/visakhapatnam/)
- [Visakhapatnam Lok Sabha constituency — Wikipedia](https://en.wikipedia.org/wiki/Visakhapatnam_Lok_Sabha_constituency)
- [GVMC — Wikipedia](https://en.wikipedia.org/wiki/Greater_Visakhapatnam_Municipal_Corporation) · [GVMC official](https://www.gvmc.gov.in/) · [Zones 8→10 — Deccan Chronicle](https://www.deccanchronicle.com/southern-states/andhra-pradesh/gvmcs-zones-increased-to-10-from-8-for-efficient-administration-1906214)
- [PGRS portal (meekosam.ap.gov.in)](https://meekosam.ap.gov.in/) · [PGRS — National Portal of India](https://www.india.gov.in/services/details/public-grievance-redressal-system-pgrs-andhra-pradesh)
- [The Wire — delays & false closures in AP's grievance system](https://m.thewire.in/article/government/too-many-delays-false-closures-why-andhras-public-grievance-redressal-system-is-facing-backlash)
- [Sachivalayam rationalization 2025](https://sachivalayam.com/rationalization-of-village-ward-secretariats/) · [GO 11 job chart](https://www.gsrmaths.in/2025/10/village-ward-sachivalayam-employees-general-job-chart-go-11.html)
- [Praja Darbar platform announcement — Devdiscourse](https://www.devdiscourse.com/article/law-order/3901141-dedicated-platform-soon-to-strengthen-public-grievance-redressal-system-andhra-cm)
