# Introduction. -----------------------------------------------------------

# 1) Analyze the NDVI/VCH differences
#   of the extended/rotated transect segments.

# Updated: 02/29/2024.


# 0) Setup. ---------------------------------------------------------------

# Load Packages.
library(tidyverse)
library(sf)

# Define the working directories.
wd_Transects <- "Your-File-Path"
# (Please update this file path with the location where
#   the relevant datasets of transect samples are stored.)


# 1) Dataset loading. -----------------------------------------------------

# Load the NDVI/VCH differences of the extended transects.
filePrefix <- "extended"

TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

extended_SHP <- st_read(
  file.path(wd_Transects,
            TwoDiff_FN),
  layer = TwoDiff_FN,
  stringsAsFactors = TRUE)

nrow(extended_SHP) # 45872.
# head(extended_SHP)

# Load the NDVI/VCH differences of the rotated transects.
filePrefix <- "rotated"

TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

rotated_SHP <- st_read(
  file.path(wd_Transects,
            TwoDiff_FN),
  layer = TwoDiff_FN,
  stringsAsFactors = TRUE)

nrow(rotated_SHP) # 66345.
# head(rotated_SHP)


# 2) Check the extended transects. ----------------------------------------

extended_DF <- 
  extended_SHP %>% 
  st_drop_geometry()

# VCH difference.
extendedVCH_DF <- 
  extended_DF %>% 
  select(starts_with("VCH"))

# NDVI difference.
extendedNDVI_DF <- 
  extended_DF %>% 
  select(starts_with("NDVI"))

# Median.
extendedVCH_DF %>% 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))%>%
  pivot_longer(everything()) %>% 
  arrange(desc(value))

extendedNDVI_DF %>% 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))%>%
  pivot_longer(everything()) %>% 
  arrange(desc(value))

# Summary.
extendedVCH_DF %>% 
  summary()

extendedNDVI_DF %>% 
  summary()


# 3) Check the rotated transects. -----------------------------------------

rotated_DF <- 
  rotated_SHP %>% 
  st_drop_geometry()

# VCH difference.
rotatedVCH_DF <- 
  rotated_DF %>% 
  select(starts_with("VCH"))

# NDVI difference.
rotatedNDVI_DF <- 
  rotated_DF %>% 
  select(starts_with("NDVI"))

# Median.
rotatedVCH_DF %>% 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))%>%
  pivot_longer(everything()) %>% 
  arrange(desc(value))

rotatedNDVI_DF %>% 
  summarise(across(where(is.numeric), 
                   .fns = list(
                     median = median
                   )))%>%
  pivot_longer(everything()) %>% 
  arrange(desc(value))

# Summary.
rotatedVCH_DF %>% 
  summary()

rotatedNDVI_DF %>% 
  summary()

