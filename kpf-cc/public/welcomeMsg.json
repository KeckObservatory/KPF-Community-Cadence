Welcome to the Keck Planet Finder Community Cadence (KPF-CC) observation request webform! This will be the tool through which you can submit your targets and desired observational strategy to the KPF-CC queue. This information will be used to run the automated schedule generator, which will produce the list of stars and their order of observation, i.e. the "script", for each night of the semester. This information will also be used to produce the Observing Blocks (OBs) that the observatory needs in order to actually execute the observations when on-sky. 

To use this webform, first you must have your program code. This code is found on the coversheet you submitted with your proposal. It consists of a single capital letter (denoting the TAC that you submitted to) and a 5 digit number. Use the semester (ie 2024B) and your program code to create a "Semester ID" of the format "2024B_X000". All requests must be made under your semester ID. 

Next you must add your targets. There are two ways to do this.
* Version 1, add a single target: select the "Add Target" button which will populate one new row in the table below.
  * Confirm that you have the correct semester and program code.
  * Under the "Actions" column (frozen to the far left side of the screen), select the pencil symbol (third from the right) to edit the table row. A new window will pop up.
  * Add your target name to the appropriate box at the top.
  * It is easiest if your target name is resolvable by Simbad.
  * If you are not sure, we suggest you open Simbad in a new tab and do a basic query for your target. If the first attempt name does not work, try another catalog name.
  * If your target name is resolvable by Simbad, click the bullseye symbol at the top left which will pull information from Simbad and auto-populate all fields that are found.
  * Any fields that are not auto-populated must be entered manually.
  * Note that often Simbad does not have Stellar effective temperatures.
  * Sometimes Simbad does not have one or both of J and G magnitudes.
  * If you used the Simbad bullseye button, the symbol will turn green after the pull is complete.
  * If you enter all information manually, the symbol may or may not turn green. If it is not green, that is ok.
 * Version 2, bulk add targets: select the "Upload Targets" button which will pop up a window.
  * Ensure that you have the correct semester and program code and hit continue.
  * Select "Load Target Names" and select file from your computer.
  * This file must be a ".txt" file and it must be in the following format: one star name per line, no spaces or commas after.
  * Hit continue.
  * Select "Create Targets".
  * When the loading bar completes, select "Finish".
  * Select "Save Targets".
  * New rows will be populated in the table.
  * Assuming each name is Simbad resolvable, this will automatically pull values from Simbad. Note again that often Stellar effective temperature is not found on Simbad and must be entered manually.


Now that the stellar parameters and coordinates are captured, it is time to input the information about the desired observational strategy for each target. This can be done by selecting the pencil symbol again to open the edit box. 

Some of the parameters are not used by the auto-scheduler algorithm but are still required as they are needed either to build the Observing Block (OB) that allows the observatory to actually execute an observation or they are needed by the pipeline team in order to produce a RV. For creating OBs, we require proper motions, epoch, J magnitude (used for setting the guide camera filter) and G magnitude (used for observers), and Gaia name for easy cross matching. To produce RVs, the KPF instrument pipeline team requires effective temperature in order to decide which binary mask to use for the CCF computation, and the systemic velocity serves as an initial guess to the absolute RV. 

Add your desired exposure time to the "Nominal Exposure Time" box. As of now, we are only accepting requests that terminate the exposure at a specific time. We are not supporting observations that terminate at a desired SNR. Therefore, when you fill in the "Nominal" box, the "Maximum Exposure Time" box auto-populates with the same value. If you are unsure what exposure time to use, we suggest using the KPF Exposure Time Calculator. The code and instructions on how to use can be found here: [https://github.com/California-Planet-Search/KPF-etc](https://github.com/California-Planet-Search/KPF-etc). 

When describing your observational strategy in terms that auto-scheduler understands, there are five key parameters. Each has a very specific definition. Please read this portion carefully.

**# of Exposures Per Visit** -- (integer) The number of observations (i.e. exposures) to be taken at each visit within a single night. The default value is 1, indicating that you want only single exposure. As an example, for a "triple shot", put 3 here.

**# of Visits Per Night** -- (integer) The number of times within a single night to visit your target and execute the X exposures, where X = "# of Exposures Per Visit"  specified above. The default value is 1, indicating that we should only observe this target 1 time in a night. For example if you want to get 2 exposures of a target within one night, but not have them back-to-back, specify 2 here (if you want them back to back, use the "# of Exposures Per Visit"). Later you will specify the time interval between visits.

**# of Nights Per Semester** -- (integer) The number of unique nights in the semester to observe the star. Each unique night, the star will be observed according to the specified "# of Visits Per Night" and "# of Exposures Per Visit". If the "# of Exposures Per Visit" and "# of Visits Per Night" are both set to 1, then this parameter can be thought of as "the number of RVs to be collected in the semester". Note that historically, KPF is scheduled for community cadence nights on ~60 unique nights in a given semester. This then represents the absolute maximum number of unique nights that a target can be observed. See feasibility below.

**Minimum Inter-Night Cadence** -- (integer)  The time, in days, that you wish to be the minimum separation between observations on unique nights. For example, if you wish to observe this target with at least 10 calendar days between observations, put 10 here. The default value is 1 which indicates that the target can be (but not necessarily will be) observed every night that KPF is on-sky up to the desired "# of Nights Per Semester". If you only request a single observation of a target in the semester (i.e. if "# of Nights Per Semester" is equal to 1), then set this value to 1. Note this is a minimum; the autoscheduler may schedule observations of a target at longer intervals than this parameter, but not shorter.

**Minimum Intra-Night Cadence** -- (Float) The time, in hours, that you wish to be the minimum separation between visits of the same target within the same night. If "# of Visits Per Night" is equal to 1, then this parameter has no meaning and is auto-set to be 0. This value may be a float (decimal) to allow for fractional hour separations.

Lastly, you may include a comment on your request. This should be written as clearly. Do not include any commas in your comment as the resulting csv file from downloading the table will be formatted incorrectly. You may put anything you like in the comment but we request you keep it concise. Examples of comments include: directions to find the correct star in a binary system or crowded field, instructions to the observers, directions to preferably only execute observing under certain conditions, etc.

When you are happy with all the inputted parameters, click outside the popup box to close it. Within the "Actions" symbols on the left side, the left most symbol will either be an orange flame symbol or a green upload symbol. If you see the flame symbol, this means there is at least one formatting error on your request. Click on the flame to see what the formatting error is, then edit the request. When you get a green upload symbol, click it to submit your request to the database. The symbol will spin as the database writes, and then display a green circular arrow. If at any time you edit the request, the circular arrow will turn orange, indicating that you must resubmit the request to capture the new information.

Upon submitting a target to the database, the cartoon face symbol on the right hand side, under the feasibility column, will change color from the untested default orange, to either the good green or bad red. This indicates the feasibility of your request. While we will never guarantee that a request will be completed in full, we can determine if a request definitely cannot be completed in full. We perform a few first order checks to determine if your request is definitely not feasible.

Requests that are definitely not feasible include:
* Requesting to observe the target on more unique nights than are historically allocated to the queue.
  * For example, if you request 100 unique night observations of a target, and the queue is only allocated 60 unique nights, then it is impossible to complete the request, i.e. definitely not feasible.
* Requesting to observe a too many unique nights at too long a minimum cadence.
  * For example, if you request 10 unique night observations of a target with a minimum cadence of 30 days, to complete this request would require 300 calendar days of baseline. However, a semester is at most 184 days long and so this request is impossible to complete, i.e. definitely not feasible.
* Both of the above scenarios also apply to the specific rise and set dates of the target within the semester. We check how many calendar days the target is accessible to Keck Observatory and then check the number of unique night requests and the required baseline.
  * For example, a star far to south might only be accessible for 30 calendar days in the semester, so requesting 40 unique night observations or requesting 10 observations at 5 day minimum cadence are both impossible to complete, i.e. definitely not feasible.
* Requesting to observe too many visits within a night at too long a minimum cadence.
  * Similar to above but on a nightly scale, if you request multiple visits too far apart, then the night will end before we can complete the request. For example, if you request 3 visits in a night at 5 hour separations, it is impossible to complete, i.e. definitely not feasible, since a night is at most 12 hours long.


If we determine that your request is feasible, then we assign it a green smiling face. This does not guarantee the request will be completed in full. If we determine that your request is Definitely Not Feasible, then we assign it a red frowning face. You may still submit this request to the queue, but do so with the knowledge that it cannot be completed as requested. Hover over the symbol to read a message describing exactly how your request violates the feasibility tests.

Thank you for using the KPF-CC Cadence Webform! If you have any questions on how to use the UI, please do not hesitate, please do not hesitate to reach out to the Project Scientist, Jack Lubin, at [jblubin@astro.ucla.edu](jblubin@astro.ucla.edu).