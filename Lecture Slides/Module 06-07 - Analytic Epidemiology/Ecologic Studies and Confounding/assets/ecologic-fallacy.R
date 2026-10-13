# Invented teaching data, not empirical evidence about income and blood pressure.
# Run from this assets folder: Rscript ecologic-fallacy.R
# The left panel uses exact, equally weighted means of the right panel's people.
income <- c(30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 90, 95, 100, 105, 110)
bp <- c(118, 115, 112, 109, 106, 136, 133, 130, 127, 124, 154, 151, 148, 145, 142)
city <- rep(c('A', 'B', 'C'), each = 5)
means_x <- tapply(income, city, mean)
means_y <- tapply(bp, city, mean)
stopifnot(all(diff(means_x) > 0), all(diff(means_y) > 0))
stopifnot(all(vapply(split(seq_along(income), city), function(i) cor(income[i], bp[i]) < 0, logical(1))))
cols <- c('#4d1979', '#60676b', '#111111')
shapes <- c(16, 17, 15)
svglite::svglite('ecologic-fallacy.svg', width = 14, height = 5, pointsize = 17, bg = 'white')
par(mfrow = c(1, 2), mar = c(4.0, 4.5, 2.8, 0.8), oma = c(0.2, 0, 1.0, 0), mgp = c(2.8, 0.8, 0), las = 1, fg = '#303030')
for (panel in 1:2) {
  plot(NA, xlim = c(20, 120), ylim = c(100, 164), xlab = '', ylab = '', axes = FALSE)
  abline(h = seq(100, 160, 20), col = '#e6e6e6', lwd = 1)
  axis(1, at = seq(20, 120, 20), cex.axis = 0.9)
  axis(2, at = seq(100, 160, 20), cex.axis = 0.9)
  mtext(if (panel == 1) 'Mean household income ($1,000/year)' else 'Household income ($1,000/year)', 1, line = 2.5, cex = 0.9)
  mtext(if (panel == 1) 'Mean systolic BP (mmHg)' else 'Systolic BP (mmHg)', 2, line = 3.1, las = 0, cex = 0.9)
  title(if (panel == 1) 'Each Point Is a City Average' else 'Each Point Is a Person', cex.main = 1.05, col.main = '#4d1979')
  if (panel == 1) {
    lines(means_x, means_y, col = '#808080', lty = 2, lwd = 2)
    points(means_x, means_y, pch = shapes, col = cols, cex = 1.5)
    text(means_x, means_y + 6, paste('City', names(means_x)), cex = 0.9)
  } else {
    for (j in 1:3) {
      i <- which(city == c('A', 'B', 'C')[j])
      lines(income[i], bp[i], col = cols[j], lwd = 2)
      points(income[i], bp[i], col = cols[j], pch = shapes[j], cex = 1.05)
      text(means_x[j], max(bp[i]) + 5, paste('City', c('A', 'B', 'C')[j]), cex = 0.9)
    }
  }
}
mtext('HYPOTHETICAL DATA', side = 3, outer = TRUE, line = 0, cex = 0.7, col = '#60676b')
invisible(dev.off())
