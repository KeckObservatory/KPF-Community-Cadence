def sel_rank(opt, xlow, xupp, minsep, slit_gap):
  print('Starting sel_rank (xlow,xupp):',xlow,xupp)

# Can we fit a minimum slit in here?
  if (xupp - xlow < minsep):        # probably too restrictive, can't fit anything in this gap, exit
    print('too restrictive,returning')
    return opt

# Start at half a slit length; stop inside half slit length
  x = opt.iloc[-1].xarcs              # grab xarc for last target option
  xstop = np.min ([x, xupp-0.5*minsep])    # stop at last target or upper limit to stop (whichever is closer)
  assert xupp-0.5*minsep > xlow, 'xupp-0.5*minsep < xlow. xstop is negative'
  xnext = xlow + 0.5 * minsep         # defines start of search range (xarc should be greater than this to fit slit)
  xlast = xlow

# Loop through to end
  i=0
  while i<len(opt.xarcs):
    ndx = opt.index[i]
    x = opt.xarcs[ndx]
    if (x < xnext):             # xarc is too close for a slit, continue
      i=i+1
      print('too close, continue')
      continue
    if (opt.X1[ndx] < xlast):         # X1 (slit edge) is less than xlast, continue
      i=i+1
      print('edge overlap, continue')
      continue
    if (x > xstop):             #xarc > last target or upper limit to stop; break
      print('exceeded xstop, break')
      break

    isel = i                 #selected index (best)
    slitlen = opt.X2[ndx] - opt.X1[ndx]
    prisel = opt.pcode[ndx] / (x - xlast) / slitlen     ##priority selection

# Now look for higher priority to win out, over range (xlast,xlook) (another 0.5*minsep)
    xlook = np.min ([x+minsep, xstop])
    if (isel < len(opt.xarcs)):       # should always be the case??
      for j in range(i+1,len(opt),1):   #starting at next option after selected, to look for a better one
        jdx = opt.index[j]        # not needed?



        if (opt.X1[jdx] > opt.X2[ndx]+slit_gap):
          continue           # There is no conflict, far enough away that it can be skipped.
                         # XXX but prisel gets higher?
        if (opt.X2[jdx] > xupp):
          continue           # XXX Can't use as slit extends too far. (inconsistent use of X2 vs x in sel_rank, should be xupp-0.5*minsep?).

        if (opt.X1[jdx] < xlast):
          continue           # MJL added (can't have it overlapp with xlast either)



        xj = opt.xarcs[jdx]
        if (xj >= xlook):        # we've looked out to our limit, break
          break

        slitlen = opt.X2[jdx] - opt.X1[jdx]
        prinorm = opt.pcode[jdx] / (xj - xlast) / slitlen
        if (prinorm > prisel):
           x = xj           # not needed, isel/prisel only?
           isel = j
           prisel = prinorm

#    nsel = nsel + 1
#    ndx = tndex[isel]
#    sel[nsel] = ndx
    ndx=opt.index[isel]
    xlast = opt.X2[ndx]
    xnext = xlast + 0.5 * minsep
    i = isel            # Reset search start point
    i=i+1
    #set selection if
    print('Saving selection ',ndx,isel)
    opt.sel[ndx]=1      # New column to differentiate between originally selected and sel_rank selected ones for re-running at different angles?

  return opt