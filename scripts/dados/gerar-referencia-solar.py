"""Fixtures independentes: equações publicadas NOAA, não usa SunCalc.
https://gml.noaa.gov/grad/solcalc/solareqns.PDF
Refração atmosférica da documentação NOAA, para elevação aparente comparável.
"""
import datetime as dt
import json
import math as m
import pathlib
rows=[]
for dia in ['2026-03-20','2026-06-21','2026-09-22','2026-12-21','2026-10-13']:
    for hora in [8.5,11.4,12,15.5,22]:
        d=dt.date.fromisoformat(dia);lat=-8.05;lon=-34.9
        # Versão por séculos julianos da planilha NOAA (calcdetails.html), não a aproximação anual de declinação.
        instante=dt.datetime(d.year,d.month,d.day,tzinfo=dt.timezone.utc)+dt.timedelta(hours=hora+3)
        jd=instante.timestamp()/86400+2440587.5;tcent=(jd-2451545)/36525
        longitude=m.radians((280.46646+tcent*(36000.76983+tcent*.0003032))%360)
        anomalia=m.radians(357.52911+tcent*(35999.05029-.0001537*tcent))
        ecc=.016708634-tcent*(.000042037+.0000001267*tcent)
        centro=m.sin(anomalia)*(1.914602-tcent*(.004817+.000014*tcent))+m.sin(2*anomalia)*(.019993-.000101*tcent)+m.sin(3*anomalia)*.000289
        omega=m.radians(125.04-1934.136*tcent)
        aparente=longitude+m.radians(centro-.00569-.00478*m.sin(omega))
        obliq=m.radians(23+(26+(21.448-tcent*(46.815+tcent*(.00059-tcent*.001813)))/60)/60+.00256*m.cos(omega))
        dec=m.asin(m.sin(obliq)*m.sin(aparente));y=m.tan(obliq/2)**2
        eq=4*m.degrees(y*m.sin(2*longitude)-2*ecc*m.sin(anomalia)+4*ecc*y*m.sin(anomalia)*m.cos(2*longitude)-.5*y*y*m.sin(4*longitude)-1.25*ecc*ecc*m.sin(2*anomalia))
        h=m.radians((hora*60+eq+4*lon+180)/4-180);phi=m.radians(lat)
        elev=m.degrees(m.asin(m.sin(phi)*m.sin(dec)+m.cos(phi)*m.cos(dec)*m.cos(h)))
        az=(m.degrees(m.atan2(m.sin(h),m.cos(h)*m.sin(phi)-m.tan(dec)*m.cos(phi)))+180)%360
        t=m.tan(m.radians(elev))
        refr=0 if elev>85 else ((58.1/t-.07/t**3+.000086/t**5)/3600 if elev>5 else (1735-518.2*elev+103.4*elev**2-12.79*elev**3+.711*elev**4)/3600 if elev>-.575 else -.020772/t)
        # A correção só se aplica quando o Sol é visível; abaixo do horizonte aceita-se erro angular amplo nos testes.
        hh=int(hora);mm=round((hora-hh)*60)
        rows.append({'dia':dia,'minutos':hh*60+mm,'azimute':round(az,6),'elevacao':round(elev+(refr if elev>0 else 0),6),'geometrica':round(elev,6)})
out=pathlib.Path(__file__).resolve().parents[2]/'tests/fixtures/solar-noaa.json'
out.write_text(json.dumps({'fonte':'https://gml.noaa.gov/grad/solcalc/calcdetails.html','metodo':'NOAA por século juliano + refração diurna, geração independente em Python','longitude':-34.9,'latitude':-8.05,'casos':rows},indent=2)+'\n')
print(out)
