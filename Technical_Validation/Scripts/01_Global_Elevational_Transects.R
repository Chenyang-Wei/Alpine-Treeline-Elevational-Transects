# Introduction. -----------------------------------------------------------

# 1) Load and check the ATET dataset.
# 2) Plot the canopy height difference between the lower and upper segments.
# 3) Plot the NDVI difference between the lower and upper segments.

# Author: Chenyang Wei (E-mail: ChenyangWei.CWei@gmail.com)
# Updated: 03/01/2024


# 0) Setup. ---------------------------------------------------------------

# Load packages.
library(tidyverse)
library(sf)
library(scales) # For calculating percentages.

# Set the theme of plots.
theme_set(theme_bw())

# Define the working directories.
wd_Transects <- "Your-File-Path"
# (Please update this file path with the location where
#   the relevant datasets of elevational transects are stored.)

wd_Figs <- file.path(
  wd_Transects, "Figures")

if(!dir.exists(wd_Figs)) {
  dir.create(wd_Figs)
}


# 1) Load and check the ATET dataset. -------------------------------------

# Determine the file format.
from_a_geopackage <- TRUE # Please change this to FALSE for a "shapefile".

# Load the ATET dataset.
transects_FileName <- "Alpine_Treeline_Elevational_Transects_v1.0"

if (from_a_geopackage) {
  transects_SF <- st_read(
    dsn = file.path(wd_Transects, "ATET_ATEC_v1.0.gpkg"),
    layer = transects_FileName,
    stringsAsFactors = TRUE)
} else {
  transects_SF <- st_read(
    dsn = file.path(wd_Transects, transects_FileName),
    layer = transects_FileName,
    stringsAsFactors = TRUE)
}

# Extract the non-spatial data of ATET.
transects_DF <- transects_SF|> 
  st_drop_geometry()

# Check the non-spatial ATET data frame.
head(transects_DF)
summary(transects_DF)


# 2) Plot the canopy height difference. -----------------------------------

# Select rows with canopy height observations 
#   of both lower and upper segments.
CanopyHt_DF <- transects_DF|> 
  filter(
    !is.na(L_CanopyHt),
    !is.na(U_CanopyHt)
  )

# Calculate the canopy height difference.
CanopyHt_DF$CanopyHt_Diff <- 
  CanopyHt_DF$U_CanopyHt - CanopyHt_DF$L_CanopyHt

CanopyHt_DF |> 
  select(L_CanopyHt, U_CanopyHt, CanopyHt_Diff) |> 
  summary()

# Create a density plot of 
#   the canopy height difference.
avg_CanopyHt_Diff <- 
  mean(CanopyHt_DF$CanopyHt_Diff)

avg_CanopyHt_Diff # -4.391395.

CanopyHt_Density <- 
  ggplot(data = CanopyHt_DF,
         aes(x = CanopyHt_Diff, 
             y = after_stat(scaled))) + 
  geom_density(fill = "blue", 
               color = "darkblue",
               alpha = 0.5) + 
  geom_vline(xintercept = 0,
             color = "red",
             lty = "dashed", lwd = 1) + 
  geom_vline(xintercept = 
               avg_CanopyHt_Diff,
             color = "darkblue",
             lty = "dashed", lwd = 1) + 
  xlab("Canopy height difference (m)") + 
  ylab("Scaled transect density")

CanopyHt_Density

# Output the density plot.
png(filename = file.path(
  wd_Figs, 
  "CanopyHt_Diff_Density.png"), 
  width = 3000, height = 1500, 
  units = "px", res = 600)
CanopyHt_Density
dev.off()

# Calculate the proportion of 
#   negative canopy height difference values.
negative_CanopyHt_Diff <- 
  CanopyHt_DF|> 
  filter(CanopyHt_Diff < 0)

percent(nrow(negative_CanopyHt_Diff) / nrow(CanopyHt_DF), 
        accuracy = 0.01) # 85.52%.


# 3) Plot the NDVI difference. --------------------------------------------

# Select rows with NDVI observations 
#   of both lower and upper segments.
NDVI_DF <- transects_DF|> 
  filter(
    !is.na(L_NDVI),
    !is.na(U_NDVI)
  )

# Calculate the NDVI difference.
NDVI_DF$NDVI_Diff <- 
  NDVI_DF$U_NDVI - NDVI_DF$L_NDVI

NDVI_DF |> 
  select(L_NDVI, U_NDVI, NDVI_Diff) |> 
  summary()

# Create a density plot of 
#   the NDVI difference.
avg_NDVI_Diff <- 
  mean(NDVI_DF$NDVI_Diff)

avg_NDVI_Diff # -0.1319143.

NDVI_Density <- 
  ggplot(data = NDVI_DF,
         aes(x = NDVI_Diff, 
             y = after_stat(scaled))) + 
  geom_density(fill = "lightgreen", 
               color = "darkgreen",
               alpha = 0.5) + 
  geom_vline(xintercept = 0,
             color = "red",
             lty = "dashed", lwd = 1) + 
  geom_vline(xintercept = 
               avg_NDVI_Diff,
             color = "darkgreen",
             lty = "dashed", lwd = 1) + 
  xlab("NDVI difference") + 
  ylab("Scaled transect density")

NDVI_Density

# Output the density plot.
png(filename = file.path(
  wd_Transects, "Figures", 
  "NDVI_Diff_Density.png"), 
  width = 3000, height = 1500, 
  units = "px", res = 600)
NDVI_Density
dev.off()

# Calculate the proportion of 
#   negative NDVI difference values.
negative_NDVI_Diff <- 
  NDVI_DF|> 
  filter(NDVI_Diff < 0)

percent(nrow(negative_NDVI_Diff) / nrow(NDVI_DF), 
        accuracy = 0.01) # 88.39%.

