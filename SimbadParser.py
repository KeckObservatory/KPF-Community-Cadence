import sys
import numpy as np
import pandas as pd
import math
from astropy.coordinates import SkyCoord
import astropy.units as u
import astropy as apy
import astroplan as apl
from astropy.time import Time
import requests
from astropy.time import TimeDelta

# Function to retrieve basic coordinate info from SIMBAD
def get_star_info(starname):
  base_url = "http://simbad.u-strasbg.fr/simbad/sim-id"
  params = {
      'Ident': starname,
      'output.format': 'ASCII'
  }

  response = requests.get(base_url, params=params)

  if response.status_code == 200:
      lines = response.text.split('\n')

      ra, dec, pm_ra, pm_dec, pm_epoch, ticname, gaianame, gaianame2, gaianame3, j_mag, g_mag, sys_Rv = None, None, None, None, None, None, None,  None, None, None, None, None

      identifiers_section = False
      bibcodes_section = False
      all_names = []

      for line in lines:
          if line.startswith('Bib'):
              bibcodes_section = True
          if line.startswith('Identifiers ('):
              identifiers_section = True
          if line.startswith('Coordinates(ICRS'):
              coords = line.split(': ')[1].split()
              ra, dec = ' '.join(coords[:3]), ' '.join(coords[3:])
              pm_epoch = line.split('=')[1].strip()[:5]

          elif line.startswith('Radial Velocity'):
              sys_rv = line.split(' ')[2].strip()

          elif line.startswith('Flux J'):
              j_mag = float(line.split(' ')[3].strip())
          elif line.startswith('Flux G'):
              g_mag = float(line.split(' ')[3].strip())
          elif line.startswith('Proper motions'):
              pm_values = line.split(':')[1].split()[:2]
              pm_ra, pm_dec = pm_values[0], pm_values[1]
          elif identifiers_section == True and bibcodes_section == False:
              identifiers = line.split()
              for i in identifiers:
                  all_names.append(i)

      for n in range(len(all_names)):
          if all_names[n] == 'TIC':
              ticname = 'TIC' + str(all_names[n+1])
          if all_names[n] == 'Gaia' and all_names[n+1] == 'DR1':
              gaianame = 'Gaia_DR1_' + str(all_names[n+2])
          if all_names[n] == 'Gaia' and all_names[n+1] == 'DR2':
              gaianame2 = 'Gaia_DR2_' + str(all_names[n+2])
          if all_names[n] == 'Gaia' and all_names[n+1] == 'DR3':
              gaianame3 = 'Gaia_DR3_' + str(all_names[n+2])

      finalgaianame = None
      if gaianame3 != None:
          finalgaianame = gaianame3
      else:
          if gaianame2 != None:
              finalgaianame = gaianame2
          else:
              if gaianame != None:
                  finalgaianame = gaianame

      if ra is None or dec is None:
          print("Star not found. Error 1.")
          return None
      else:
          rasplit = ra.split(" ")
          ra = rasplit[0] + ":" + rasplit[1] + ":" + rasplit[2][:5]
          decsplit = dec.split(" ")
          dec = decsplit[0] + ":" + decsplit[1] + ":" + decsplit[2][:5]

          # Convert SIMBAD default RA and Dec format to decimal format
          c = SkyCoord(ra=ra, dec=dec, unit=(u.hourangle, u.deg))
          ra_angle = round(c.ra.deg,2)
          dec_angle = round(c.dec.deg,2)

          return {'Name':starname, 'RA':ra_angle, 'Dec':dec_angle, 'pmRA':pm_ra, 'pmDec':pm_dec, 'Epoch':pm_epoch, 'TIC':ticname, 'GaiaID':finalgaianame, 'Jmag':j_mag, 'Gmag':g_mag, "SysRV":sys_rv}
  else:
      print("Star not found. Error 2.")
      return None
      
print(get_star_info('M31'))
