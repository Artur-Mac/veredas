## 9. Computer Vision Deep Dive: Beyond Superficial Crack Bounding-Boxes

In the first research pass, computer vision was treated primarily as an automated defect detector (e.g., detecting cracks). Here, we expand computer vision into a **multi-layered spatial, environmental, and forensic intelligence pipeline**.

```
+---------------------------------------------------------------------------------------------------+
|                                   COMPUTER VISION MULTI-TIER PIPELINE                             |
+--------------------------+--------------------------+---------------------------------------------+
| 1. Physical Condition    | 2. Spatial Understanding | 3. Multimodal Consistency Auditing          |
| • Efflorescence textures | • RoomPlan 3D meshes     | • Listing text vs photo discrepancy         |
| • Crack shear geometry   | • Usable floor plan CAD  | • Wide-angle lens optical correction        |
| • Rebar corrosion bleed  | • Ceiling height truth   | • Staged vs empty room subtraction          |
+--------------------------+--------------------------+---------------------------------------------+
```

### 9.1 Forensic Physical Condition Analysis
1. **Crack Morphology Classification (Structural Settlement vs Plaster Crazing)**:
   * *The Problem*: Novice buyers panic at harmless hairline plaster cracks, yet overlook severe diagonal shear cracks indicating differential foundation subsidence.
   * *Computer Vision Architecture*: High-resolution edge detection and morphological segmentation analyze crack width, propagation angle, and continuity:
     * *Non-Structural Thermal Crazing*: Width $< 0.4mm$, isotropic spiderweb branching in plaster coat.
     * *Dangerous Structural Settlement*: Width $> 1.5mm$, propagating at ~45-degree diagonal trajectories from door lintels or vertical shear along concrete columns.
2. **Moisture, Efflorescence & Paint Camouflage Detection**:
   * *The Problem*: Flippers paint over active subterranean moisture and mold 48 hours before viewings.
   * *Mechanism*: Under directional smartphone illumination, computer vision models detect subtle surface specular reflections and micro-textural bubbling caused by efflorescence (calcium carbonate salts leaching through porous masonry) beneath fresh latex paint films.
3. **Rebar Corrosion Rust Bleed (*Armadura Exposta*)**:
   * *Mechanism*: Semantic segmentation trained on concrete pathology detects iron oxide orange/brown leaching along exterior balcony beams and window parapets, diagnosing concrete carbonation before spalling occurs.

### 9.2 Spatial & Geometric Reconstruction
1. **Parametric Floor Plan Extraction (Apple RoomPlan & Depth Anything)**:
   * *The Problem*: Brokers routinely inflate apartment square footage by 15% to 25%, advertising gross construction area (*área privativa total*) rather than usable floor area (*área útil real*).
   * *Mechanism*: RoomPlan utilizes iOS LiDAR and spatial neural networks to identify walls, doors, windows, and ceiling boundaries, exporting clean 2D CAD architectural floor plans and exact usable interior square meters in under 2 minutes.
2. **Ceiling Height & Vertical Clearance Auditing**:
   * *Mechanism*: Vertical depth rays verify true ceiling clearance. Older low-clearance units ($< 2.40m$) or units with aggressive dropped plaster ceilings (*forro de gesso*) are flagged for poor ventilation and lighting constraints.

### 9.3 Multimodal Consistency Auditing: Catching Verification Gaps
Rather than claiming legal fraud, the platform performs **multimodal discrepancy audits** comparing listing claims against empirical photographic evidence:

```
[ Listing Description Claims ] ◄───┐
                                   ├──► [ Discrepancy & Verification Gap Engine ]
[ Listing Photographic Evidence ] ◄┘          • "Spacious 3-Bedroom" vs 2 Beds detected
                                              • "Abundant Natural Light" vs Zero Sky in Panoramas
                                              • "Fully Renovated" vs 1980s Electrical Outlets
```

1. **Room Count & Dimension Inconsistencies**: The listing advertises "3 Suites"; computer vision object detection and room classification detect only 2 bedrooms and 1 windowless storage closet (*despensa*) falsely labeled as a bedroom.
2. **Wide-Angle Optical Distortion Inversion**: Staging photographers use extreme 14mm ultra-wide-angle lenses that distort perspective, making a 12m² bedroom appear 25m² wide. The engine estimates focal length and inverts wide-angle barrel distortion to display the room in realistic 35mm human visual perspective.
3. **Virtually Staged Furniture Extraction**: Generative computer vision detects digitally rendered 3D furniture superimposed by staging services (BoxBrownie), removing the fake furniture to show the bare, cramped reality of the space.

---

## 10. Smartphone Sensors: Grounding What Can Realistically Be Measured

To avoid technical science fiction, we rigorously classify smartphone sensing capabilities into three mandatory epistemological categories based on physical hardware limitations during a brief 10-minute property walkthrough.

```
+---------------------------------------------------------------------------------------------------+
|                                 SMARTPHONE SENSING REALITY MATRIX                                 |
+-----------------------------------+-----------------------------------+---------------------------+
| 1. Technically Measurable         | 2. Model-Inferable                | 3. TOO RISKY TO CLAIM     |
| (Direct physics ground-truth)     | (Requires contextual prior)       | (Unreliable on phones)    |
| • Usable dimensions (LiDAR)       | • Ambient noise level (Lden)      | • Party-wall STC rating   |
| • Window azimuth / orientation    | • Daylight hours per window       | • Sub-surface pipe leaks  |
| • Vertical floor height barometer | • Cellular structural attenuation | • Foundation stability    |
+-----------------------------------+-----------------------------------+---------------------------+
```

### Table 10.1: Detailed Evaluation of Smartphone Sensors

| Sensor Suite | Hardware Constraints | Technically Measurable (Direct) | Model-Inferable (Proxy) | Too Risky to Claim (Avoid) |
| :--- | :--- | :--- | :--- | :--- |
| **Microphone Array** | Non-calibrated MEMS capsules; automatic gain control (AGC); temporary noises | Instantaneous instantaneous sound pressure level ($dBA$); dominant peak frequencies | Projected rush-hour traffic decibels based on distance-decay acoustic transfer functions | **Full party-wall acoustic isolation (STC)**; 24-hour equivalent noise ($L_{den}$) from a 3-minute sample |
| **LiDAR / Time-of-Flight** | Range limited to ~5 meters; struggles on shiny black/mirror surfaces; iOS Pro only | Interior room boundary coordinates; ceiling heights; wall-to-wall distances ($\pm 2cm$) | Usable floor plan layout; furniture clearance envelopes | **Structural load-bearing wall identification**; building exterior foundation settling |
| **Magnetometer / Compass** | Massive electromagnetic interference from rebar in reinforced concrete walls | True magnetic orientation when standing away from structural steel columns | Facade azimuth angle and alignment with city street grid | **Precise indoor orientation when held touching steel-reinforced columns** |
| **Barometer** | Atmospheric barometric drift during weather fronts; requires reference station | Vertical atmospheric pressure differential; relative elevation change ($\pm 0.5m$) | True building floor level and vertical height relative to ground entry | **Absolute elevation above sea level without real-time airport QNH reference** |
| **Camera (RGB Sensor)** | Auto-exposure compensation; dynamic range limits; digital sharpening | Physical visible defects (cracks, peeling paint, efflorescence textures); window frame geometry | Natural daylight sufficiency score; window horizon sky view factor | **Active moisture behind dry paint** (requires thermal IR or pin-type hygrometer) |
| **Accelerometer / Gyro** | Low-frequency baseline drift; micro-vibrations swamped by user hand tremor | High-energy floor vibration impulses (e.g., freight train or heavy bus rumble) | Resonance damping characteristics when phone is clamped to floor | **Structural foundation integrity**; sub-floor acoustic dampening |
| **Cellular / Wi-Fi Modem** | Baseband firmware throttling; antenna hand attenuation | RSRP / RSRQ signal strength; Wi-Fi BSSID scan; crowd-measured download latency | Structural RF penetration attenuation through building envelope | **Building-wide telework guarantee** (fixed broadband ISP may perform differently) |

---

## 11. Products That Turn Users into Sensors: Crowdsourced Defensibility

The most impenetrable data moats in tech (Waze, OpenStreetMap, Strava, Glassdoor) are built by transforming ordinary users into active or passive environmental sensors.

```
+---------------------------------------------------------------------------------------------------+
|                                  CROWDSOURCED SENSING ARCHITECTURE                                |
+---------------------------+---------------------------+-------------------------------------------+
| Passive Sensing           | Active Micro-Actions      | Give-to-Get Incentive Flywheel            |
| • Background audio clips  | • 1-Tap defect tagging    | • Review your current apartment           |
| • GPS elevation traces    | • Floor plan room scans   |   to unlock confidential whisper reports  |
| • Cellular signal pings   | • Water pressure checks   |   on your target apartment building       |
+---------------------------+---------------------------+-------------------------------------------+
```

### 11.1 The "Give-to-Get" Mechanics (The Building Glassdoor Model)
* **The Structural Asymmetry**: Landlords and building managers have near-total information superiority over prospective renters. Current tenants possess deep, unwritten institutional knowledge (the elevator breaks down twice a month, water pressure drops at 19:00, the upstairs neighbor's dog barks constantly).
* **The Incentive Engine**: Following Glassdoor's proven playbook, users are granted free basic access, but **must submit one structured, verified review of their current or past apartment** to unlock deep forensic whisper dossiers on target properties.
* **Proof of Tenancy Verification**: To prevent fake reviews, tenants verify residency via utility bill OCR (Compesa, Enel, Sabesp) or geofenced physical location dwelling over 30 days.

### 11.2 The "Touring Due-Diligence Quest" (Active Citizen Science)
* Rather than asking users to collect data for the platform, the platform offers an **interactive inspection guide during property tours**:
  * *"Quest 1: Turn on the shower and run water for 30 seconds" (records pressure and drainage).*
  * *"Quest 2: Point camera at the bedroom window" (runs AR solar ephemeris trajectory).*
  * *"Quest 3: Scan the living room with LiDAR" (generates CAD floor plan).*
* The user performs these actions purely for their own self-interest (to evaluate the property). In doing so, they passively upload ground-truth forensic data that enriches the building's permanent digital title for all future users.
