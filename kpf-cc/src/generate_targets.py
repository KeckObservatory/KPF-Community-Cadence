#!/usr/bin/python
# -*- coding: latin-1 -*-
import datetime
import json
import numpy as np
import random
import string
from itertools import product
from functools import wraps
seed = 1984739
random.seed(seed)

pis = {
    "Michael Bluth": 5555,
    "Lindsay Bluth-F\u00FCnke": 7766,
    "Gob Bluth": 8877,
    "George Michael Bluth": 8899,
    "Maeby F\u00FCnke": 7799,
    "Buster Bluth": 8765,
    "Tobias F\u00FCnke": 9998,
    "George Bluth Sr.": 1144,
    "Lucille Bluth": 7644,
}

observers = [
    "Narrator",
    "Oscar Bluth",
    "Lucille Austero",
    "Barry Zuckerkorn",
    "Kitty Sanchez",
    "Steve Holt",
    "Lupe",
    "Annyong Bluth",
    "Carl Weathers",
    "Maggie Lizer",
    "Stefan Gentles",
    "Marta Estrella",
    "Cindi Lightballoon",
    "John Beard",
    "Ann Veal",
    "Wayne Jarvis",
    "Dr. Fishman",
    "Stan Sitwell",
    "Sally Sitwell",
    "Mort Meyers",
    "Starla",
    "Tony Wonder",
    "Gene Parmesan",
    "Terry Veal",
    "Rita Leeds",
    "Larry Middleman",
    "Bob Loblaw",
    "Ron Howard",
    "DeBrie Bardeaux",
    "Rebel Alley",
    "Herbert Love",
    "Marky Bark",
    "Argyle Austero",
    "Paul 'P-Hound' Huan",
    "Mark Cherry",
    "Murphy Brown F\u00FCnke",
    "Lottie Dottie Da",
    "Dusty Radler"
]

comments = [
    "Here?s some money. Go see a star war.",
    "I don?t understand the question and I won?t respond to it.",
    "I am one of the few honest people I have ever known.",
    "I?m a scholar. I enjoy scholarly pursuits.",
    "I?ve made a huge tiny mistake.",
    "I hear the jury?s still out on science.",
]

targetNames = [ 
"M31",
"HD19994",
"HD75732",
"HD217107",
"HD145675",
"HD210277",
"HD154345",
"HD82943",
"HD50554",
"HD128311"
] 


status = [
    "Started",
    "Executed",
    "Completed",
    "Failed",
    "Terminated",
    "Stopped",
]

sem_ids = [
    "2017A_U033",
    "2017A_U050",
    "2017B_U042",
    "2017B_U043",
    "2018A_U042",
    "2018A_U043",
    "2018A_U044",
    "2018A_U045",
    "2018B_U016",
    "2018B_U064",
    "2019A_N020",
    "2019A_U123",
    "2019A_U124",
    "2019B_U158",
    "2019B_U159",
    "2019B_U160",
    "2020A_N028",
    "2020A_U169",
    "2020B_U048",
    "2020B_U049",
    "2020B_U082",
    "2020B_N133",
    "2021A_U046",
    "2021A_U073",
    "2021A_N140",
    "2021B_U056",
    "2021B_N057"
]

programs = [x.split('_')[1] for x in sem_ids]

NOBS = 20  # number of observation blocks


def randOBIds(x=5): return [int(x) for x in list(np.random.choice(
    range(0, NOBS+1), size=random.randint(0, x), replace=False))]


semesters = [str(x)+y for x, y in product(range(2019, 2022), ['A', 'B'])]
letters = string.ascii_lowercase

# random generators


def randString(x=4): return ''.join(random.choice(letters) for i in range(x))
def randFloat(mag=10): return mag * random.uniform(0, 1)
def randTargetName(): return random.choice(targetNames)
def randBool(): return bool(random.choice([0, 1, None]))
def randInt(lr=0, ur=100): return random.randint(lr, ur)
def randArrStr(x=1, y=1): return [randString(x)
                                  for _ in range(random.randint(1, y))]


def optionalRandString(x=4): return random.choice([None, randString(x)])
def optionalRandArrString(x, y=1): return random.choice(
    [None, randArrStr(x, y)])


def randPI(): return random.choice(list(pis))
def randObserver(): return random.choice(observers)
def randSemester(): return random.choice(semesters)
def randProgId(): return random.choice(programs)
def randSemId(): return random.choice(sem_ids)


def randPIList(x=1): return lambda x=1: list(np.random.choice(
    list(pis), size=random.randint(1, x), replace=False))
def randObserverList(x=1): return list(np.random.choice(
    observers, size=random.randint(1, x), replace=False))


def randComment(): return random.choice(comments)
def optionalRandComment(): return random.choice([None, randComment()])
def randSemesterList(x=3): return list(np.random.choice(
    semesters, size=random.randint(0, x), replace=False))


def z_fill_number(x, zf=2): return str(x).zfill(2)


raDeg = z_fill_number(randInt(0, 360))
arcMinutes = z_fill_number(randInt(0, 60))
arcSeconds = z_fill_number(randInt(0, 60))

decDeg = z_fill_number(randInt(0, 90))
elevation = random.choice(['+', '-'])


def random_dates():
    start_date = datetime.date(2018, 1, 1)
    end_date = datetime.date(2021, 2, 1)

    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)

    return random_date


def generate_ra():
    raDeg = z_fill_number(randInt(0, 24))
    arcMinutes = z_fill_number(randInt(0, 60))
    arcSeconds = z_fill_number(randInt(0, 60))
    ra = ":".join([raDeg, arcMinutes, arcSeconds])
    return ra


def generate_dec():
    arcMinutes = z_fill_number(randInt(0, 60))
    arcSeconds = z_fill_number(randInt(0, 60))
    decDeg = z_fill_number(randInt(0, 90))
    elevation = random.choice(['+', '-'])
    dec = elevation+":".join([decDeg, arcMinutes, arcSeconds])
    return dec


def remove_none_values_in_dict(method):
    """
    None values in dict returned by method are removed
    """

    @wraps(method)
    def remove_none(*args, **kw):
        result = method(*args, **kw)
        if type(result) is dict:
            return {key: val for key, val in result.items() if val is not None}
        else:
            return result
    return remove_none


def generate_semester(sem, nLen, maxLen=6):
    return {'_id': sem,
            'semester': sem,
            'obs_id': randObserverList(maxLen),
            'comment': optionalRandComment()
            }


def generate_semesters(nSem, nLen=5, maxLen=6):
    return [generate_semester(sem, nLen, maxLen) for sem in semesters[0:nSem]]


@remove_none_values_in_dict
def generate_target():
    return {
        "_id": randString(24),
        "semester": randSemester(),
        "prog_id": randProgId(),
        "pi": randPI(),
        "target_name": randTargetName(),
        "target_valid": randBool(),
        "j_mag": randInt(0, 20),
        "t_eff": randInt(0, 10000),
        "simucal_on": randBool(),
        "nominal_exposure_time": randInt(1, 1000),
        "maximum_exposure_time": randInt(1, 1000),
        "num_visits_per_night": randInt(1, 10),
        "num_unique_nights_per_semester": randInt(1, 50),
        "minimum_intranight_cadence": randInt(1, 10),
        "minimum_internight_cadence": randInt(1, 10),
        "num_observations_per_visit": randInt(1, 10),        
    }


if __name__ == '__main__':
    seed = 1984739
    random.seed(seed)
    # Create ob_blocks collection
    print("...generating targets")
    docs = [ generate_target() for _ in range(NOBS) ]

    json_string = json.dumps(docs)
    with open('targets.json', 'w') as outfile:
        json.dump(docs, outfile, indent=4)
