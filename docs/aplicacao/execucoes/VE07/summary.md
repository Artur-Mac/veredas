# VE07 — Summary

VE07 (Solar geometry for façade and walking choices) is **partial**: the façade comparison is built, tested and shown in the dossier; the shaded-walk option was evaluated but deliberately kept out of the app; no field observations exist yet. Madalena now has solar coverage: the two official Prefeitura building files were downloaded again, matched the hashes recorded in October, and rerunning the preparation reproduced the four existing areas byte for byte while adding Madalena (15,701 volumes). The Edifício tab has a new block, "O sol nas fachadas" ([SolNasFachadas.tsx](../../../../src/componentes/dossie-v1/SolNasFachadas.tsx)), that leads with what is certain and useful at Recife's latitude: which side of the building faces the sun in the morning and afternoon, in summer and in winter. North and south swap between December and June, and the block names the visit hour when the difference shows ("…o lado sul do prédio fica de frente para o sol por cerca de 7 h no verão; o lado norte, nenhuma. No inverno (junho) é o contrário… visite por volta das 8h"). Neighbour shading appears only as a qualifier, stated when the cadastral model is decisive and otherwise flagged as unknowable. Per-side hours, with and without neighbours, are one tap away, and "Levar para a visita" saves the check to the visit roteiro. The block makes no claim about interior temperature or about which way a given flat faces.

Checks run: Jest 60/60 suites and 1,514 tests (8 new façade tests), Node 77/77 (4 new for the ray module), typecheck and lint clean, web smoke 50/50, and rendered checks at 375 and 360 px on a Boa Viagem and a Madalena building, with no overflow, page errors or external requests (0.5–0.75 s to the result). The new tests cover:
- opposite faces;
- night;
- the seasons at 8° S;
- a tall neighbour removing afternoon sun;
- a neighbour of unknown height;
- missing geometry;
- the exact wording.

Review fixed six problems:
- reusing the window engine made every range "0 to 6.5 h", because any neighbour with unknown height was treated as a 200 m tower;
- a same-lot podium of unknown height kept most hours uncertain, so the lead now uses orientation and the neighbour effect became a qualifier;
- two test expectations contradicted the physics: solar noon is about 11:18 civil time, and the December sun stays to the south;
- awkward wording;
- a test-teardown leak that made Jest exit 1 with all tests passing;
- an extra-distance bug in the route experiment.

The route experiment covered 20 building-to-grocery pairs, each at two dates and two hours, against 57,851 cadastral volumes. A shadier route survived height and missing-building variants in only 6 of 80 cases, saving 1–3.6 minutes of sun for 13–43 m of extra walking. Trees, awnings and sidewalk side are not modelled, so that benefit is below the model's uncertainty, and route shade stays out of the app, as the experiment card's kill rule requires.

Decision: **iterate**. Remaining for VE07:
- collect dated façade observations and the G-SHADE field observations ([sheet](../../evaluation-sets/g-shade-observacao.csv));
- find a tree and marquee source before revisiting shaded walks;
- obtain heights for annexes and podiums, which cause most of the uncertainty;
- time the block on a phone.

The next functional epoch is **VE08 (evening walking and relevant noise sources)**, which can build on the VE03 network, the VE05 late-return transit, and the corrected corridor counts.
