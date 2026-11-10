#!/usr/bin/env Rscript
# Build only the quantitative figures used by the November 11 lesson. Read the
# approved Excel demonstration so slide values remain aligned with the workbook.
# Usage: Rscript _ai/tools/R/build_random_error_figures.R path/to/deck/assets
suppressPackageStartupMessages({
  library(dplyr)
  library(ggplot2)
  library(readxl)
})

args <- commandArgs(trailingOnly = TRUE)
stopifnot(length(args) == 1L, dir.exists(args[[1]]))
assets <- args[[1]]
workbook <- file.path(assets, "prepared-excel-sampling-demonstration.xlsx")
stopifnot(file.exists(workbook))

# Read the saved Excel results rather than regenerating samples. The fixed
# population and 100 samples were approved for this teaching demonstration.
samples <- read_excel(workbook, sheet = "Samples", range = "A7:M107") |>
  transmute(
    sample = Sample, n = n, mean = Mean, sd = `Sample SD`, se = SE,
    lower = `Lower CI`, upper = `Upper CI`, capture = `Captures mean?`,
    error = `Sampling error`, population_mean = `Population mean`
  )
population <- read_excel(workbook, sheet = "Population", range = "A9:B10009")
mu <- mean(population$`StressScore (points)`)
stopifnot(nrow(samples) == 100L, all(samples$n == 12),
          all(abs(samples$population_mean - mu) < 1e-10),
          sum(samples$capture == "Capture") == 98L)

# Check the cached spreadsheet calculations with R's independent t quantile.
# These checks protect the slide figures from a changed or stale workbook.
stopifnot(
  all(abs(samples$se - samples$sd / sqrt(samples$n)) < 1e-10),
  all(abs(samples$lower - (samples$mean - qt(.975, 11) * samples$se)) < 1e-8),
  all(abs(samples$upper - (samples$mean + qt(.975, 11) * samples$se)) < 1e-8)
)

purple <- "#4D1979"
orange <- "#A63E12"
theme_set(theme_minimal(base_size = 22, base_family = "Arial") +
  theme(panel.grid.minor = element_blank(),
        panel.grid.major.x = element_blank(),
        axis.title = element_text(size = 20),
        plot.margin = margin(12, 24, 10, 12),
        legend.position = "none"))

#' Save a lesson chart as a vector graphic
#'
#' Preserve readable labels when Reveal scales the slide to a projector.
#' @param plot A ggplot object containing the instructional figure.
#' @param filename SVG filename within the deck's assets directory.
#' @param height Height in inches at the fixed 12-inch figure width.
#' @return The output path, invisibly.
save_figure <- function(plot, filename, height = 4.6) {
  output <- file.path(assets, filename)
  ggsave(output, plot, width = 12, height = height, device = svglite::svglite,
         bg = "white")
  invisible(output)
}

# The first two figures reproduce the older lecture's gradual introduction of
# a population value, one sample, and a second sample, using the approved data.
for (sample_count in 1:2) {
  shown <- tibble(
    label = c("Population", paste("Sample", seq_len(sample_count))),
    value = c(mu, samples$mean[seq_len(sample_count)])
  ) |>
    mutate(label = factor(label, levels = c("Sample 2", "Sample 1", "Population")))
  p <- ggplot(shown, aes(value, label)) +
    geom_vline(xintercept = mu, color = "#68636B", linetype = "dashed", linewidth = .8) +
    geom_point(color = purple, size = 5) +
    geom_text(aes(label = sprintf("%.2f", value)), nudge_x = .28,
              hjust = 0, size = 8, color = purple) +
    scale_x_continuous(limits = c(17, 25), breaks = seq(17,25,2)) +
    scale_y_discrete(drop = FALSE) +
    labs(x = "Mean StressScore (points)", y = NULL) +
    theme(panel.grid.major.y = element_blank())
  save_figure(p, paste0("sampling-population-", sample_count, ".svg"), 3.5)
}

# The first ten prepared samples retain the older deck's study-number framing.
# The second plot changes the scale to signed errors, without forcing a zero sum.
first_ten <- slice_head(samples, n = 10)
p <- ggplot(first_ten, aes(sample, mean)) +
  geom_hline(yintercept = mu, color = "#68636B", linetype = "dashed", linewidth = .8) +
  geom_point(color = purple, size = 4.5) +
  scale_x_continuous(breaks = 1:10) +
  scale_y_continuous(limits = c(18,25), breaks = seq(18,24,2)) +
  labs(x = "Sample number", y = "Sample mean StressScore")
save_figure(p, "sampling-repeated-means.svg")
p <- ggplot(first_ten, aes(sample, error)) +
  geom_hline(yintercept = 0, color = "#68636B", linetype = "dashed", linewidth = .8) +
  geom_segment(aes(xend = sample, y = 0, yend = error), color = purple, linewidth = .7) +
  geom_point(color = purple, size = 4.5) +
  scale_x_continuous(breaks = 1:10) +
  scale_y_continuous(limits = c(-3,3), breaks = -3:3) +
  labs(x = "Sample number", y = "Sampling error (points)")
save_figure(p, "sampling-errors.svg")

# The full interval plot is the offline fallback for the Excel demonstration.
# Color and point shape both identify misses, and the caption gives their count.
p <- ggplot(samples, aes(sample, mean, color = capture, shape = capture)) +
  geom_linerange(aes(ymin = lower, ymax = upper), linewidth = .55) +
  geom_point(size = 2.4) +
  geom_hline(yintercept = mu, color = "#39343E", linetype = "dashed", linewidth = .85) +
  scale_color_manual(values = c(Capture = purple, Miss = orange)) +
  scale_shape_manual(values = c(Capture = 16, Miss = 17)) +
  scale_x_continuous(breaks = c(1,seq(20,100,20)), limits = c(0,101)) +
  scale_y_continuous(breaks = seq(14,28,2)) +
  labs(x = "Sample number", y = "Mean and 95% CI (points)")
save_figure(p, "sampling-ci-coverage.svg", 4.1)
cat("Saved five figures. Population mean:", mu,
    "; misses:", paste(samples$sample[samples$capture == "Miss"], collapse = ", "), "\n")
