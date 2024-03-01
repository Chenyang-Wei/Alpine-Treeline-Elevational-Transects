# Introduction. -----------------------------------------------------------

# 1) Analyze the NDVI/VCH differences between the upper and lower
#   segments of the extended and rotated transect samples, respectively.

# Author: Chenyang Wei (E-mail: ChenyangWei.CWei@gmail.com)
# Updated: 03/01/2024


# 0) Setup. ---------------------------------------------------------------

# Load Packages.
library(tidyverse)
library(sf)

# Define the working directories.
wd_Transects <- "Your-File-Path"
# (Please update this file path with the location where
#   the relevant datasets of transect samples are stored.)


# 1) Dataset loading. -----------------------------------------------------

# Determine the file format.
from_a_geopackage <- TRUE # Please change this to FALSE for a "shapefile".

# Load the NDVI/VCH differences of the extended transects.
filePrefix <- "extended"

TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

if (from_a_geopackage) {
  extended_SF <- st_read(
    dsn = file.path(wd_Transects, "Adjusted_Transect_Samples.gpkg"),
    layer = TwoDiff_FN,
    stringsAsFactors = TRUE)
} else {
  extended_SF <- st_read(
    file.path(wd_Transects, TwoDiff_FN),
    layer = TwoDiff_FN,
    stringsAsFactors = TRUE)
}

# Examine the extended transects.
nrow(extended_SF) # 45872.
head(extended_SF)

# Load the NDVI/VCH differences of the rotated transects.
filePrefix <- "rotated"

TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

if (from_a_geopackage) {
  rotated_SF <- st_read(
    dsn = file.path(wd_Transects, "Adjusted_Transect_Samples.gpkg"),
    layer = TwoDiff_FN,
    stringsAsFactors = TRUE)
} else {
  rotated_SF <- st_read(
    file.path(wd_Transects, TwoDiff_FN),
    layer = TwoDiff_FN,
    stringsAsFactors = TRUE)
}

# Examine the rotated transects.
nrow(rotated_SF) # 66345.
head(rotated_SF)


# 2) Check the extended transects. ----------------------------------------

extended_DF <- 
  extended_SF|> 
  st_drop_geometry()

# VCH difference.
extendedVCH_DF <- 
  extended_DF|> 
  select(starts_with("VCH"))

# NDVI difference.
extendedNDVI_DF <- 
  extended_DF|> 
  select(starts_with("NDVI"))

# Median values.
extendedVCH_DF|> 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))|> 
  pivot_longer(everything())|> 
  arrange(desc(value))

extendedNDVI_DF|> 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))|> 
  pivot_longer(everything())|> 
  arrange(desc(value))

# Summary statistics.
extendedVCH_DF|> 
  summary()

extendedNDVI_DF|> 
  summary()


# 3) Check the rotated transects. -----------------------------------------

rotated_DF <- 
  rotated_SF|> 
  st_drop_geometry()

# VCH difference.
rotatedVCH_DF <- 
  rotated_DF|> 
  select(starts_with("VCH"))

# NDVI difference.
rotatedNDVI_DF <- 
  rotated_DF|> 
  select(starts_with("NDVI"))

# Median values.
rotatedVCH_DF|> 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))|> 
  pivot_longer(everything())|> 
  arrange(desc(value))

rotatedNDVI_DF|> 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))|> 
  pivot_longer(everything())|> 
  arrange(desc(value))

# Summary statistics.
rotatedVCH_DF|> 
  summary()

rotatedNDVI_DF|> 
  summary()

