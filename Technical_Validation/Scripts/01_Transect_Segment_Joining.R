# Introduction. -----------------------------------------------------------

# 1) Calculate the NDVI/VCH differences
#   of the rotated/extended transect segments.
# 2) Join the NDVI/VCH differences with
#   the corresponding sampled transects.

# Updated: 10/24/2023.


# 0) Setup. ---------------------------------------------------------------

# Load Packages.
library(tidyverse)
library(sf)

## Object definition.
# Define the working directories.
wd_Treeline <- "C:/Research_Projects/Treeline_LOCAL"

wd_Transects <- 
  file.path(wd_Treeline, 
            "Elevational_Transects_LOCAL",
            "Sampled_Transects")

# Define the variable/file/folder names
#   for either the extended or rotated transects.
extension <- FALSE

if (extension) {
  
  folderName <- "Extension"
  
  filePrefix <- "extended"
  
  groupName <- "ratio"
  
  NDVI_rawDiff_VarName <- "NDVI_1"
  
  VCH_rawDiff_VarName <- "VCH_1"
  
} else {
  
  folderName <- "Rotation"
  
  filePrefix <- "rotated"
  
  groupName <- "theta"
  
  NDVI_rawDiff_VarName <- "NDVI_0"
  
  VCH_rawDiff_VarName <- "VCH_0"
  
}


# 1) Dataset loading. -----------------------------------------------------

# Load the sampled transects.
sampled_FN <- "sampledTransects"

sampled_SHP <- st_read(
  file.path(wd_Transects,
            sampled_FN),
  layer = sampled_FN,
  stringsAsFactors = TRUE)

nrow(sampled_SHP) # 66776.
head(sampled_SHP)
summary(sampled_SHP)

# Load the processed transects.
processed_FN <- paste0(filePrefix, "Transects")

processed_SHP <- st_read(
  file.path(wd_Transects,
            folderName,
            processed_FN),
  layer = processed_FN,
  stringsAsFactors = TRUE)

nrow(processed_SHP) # 400656 (extended/rotated).
head(processed_SHP)

# Load the processed transect segments with the NDVI data.
NDVIsegments_FN <- paste0(filePrefix, "Segments_NDVI")

NDVIsegments_SHP <- st_read(
  file.path(wd_Transects,
            folderName,
            NDVIsegments_FN),
  layer = NDVIsegments_FN,
  stringsAsFactors = TRUE)

nrow(NDVIsegments_SHP) # 756264 (extended) or 801312 (rotated).
head(NDVIsegments_SHP)

# Load the processed transect segments with the VCH data.
VCHsegments_FN <- paste0(filePrefix, "Segments_VCH")

VCHsegments_SHP <- st_read(
  file.path(wd_Transects,
            folderName,
            VCHsegments_FN),
  layer = VCHsegments_FN,
  stringsAsFactors = TRUE)

nrow(VCHsegments_SHP) # 756264 (extended) or 801312 (rotated).
head(VCHsegments_SHP)


# 2) Data preprocessing. --------------------------------------------------

# Select the NDVI segment variables.
vars_NDVI <- c("ET_ID", "Segment_ID", 
               "avg_Elv", "avg_NDVI", 
               groupName)

NDVIsegments_SHP <- NDVIsegments_SHP %>% 
  select(all_of(vars_NDVI))

head(NDVIsegments_SHP)

# Select the VCH segment variables.
vars_VCH <- c("ET_ID", "Segment_ID", 
              "avg_Elv", "avg_VCH", 
              groupName)
  
VCHsegments_SHP <- VCHsegments_SHP %>% 
  select(all_of(vars_VCH))

head(VCHsegments_SHP)

# Drop geometries.
NDVIsegments_DF <- NDVIsegments_SHP %>% 
  st_drop_geometry()

VCHsegments_DF <- VCHsegments_SHP %>% 
  st_drop_geometry()


# 3) NDVI segment joining. ------------------------------------------------

# Rename the NDVI columns by the segment type.
NDVIsegments_DF_1 <- NDVIsegments_DF %>% 
  filter(Segment_ID == 1) %>% 
  select(-Segment_ID) %>% 
  rename(Elv_1 = avg_Elv, NDVI_1 = avg_NDVI)

NDVIsegments_DF_2 <- NDVIsegments_DF %>% 
  filter(Segment_ID == 2) %>% 
  select(-Segment_ID) %>% 
  rename(Elv_2 = avg_Elv, NDVI_2 = avg_NDVI)

# Join the two types of the NDVI segments. 
NDVIsegments_DF <- merge(
  x = NDVIsegments_DF_1,
  y = NDVIsegments_DF_2,
  by = c("ET_ID", 
         groupName),
  all = FALSE
)

# Remove the segments without NDVI (NAs).
NDVIsegments_DF <- NDVIsegments_DF %>% 
  drop_na()

summary(NDVIsegments_DF)
nrow(NDVIsegments_DF) # 377839 (extended) or 400417 (rotated).


# 4) VCH segment joining. -------------------------------------------------

# Rename the VCH columns by the segment type.
VCHsegments_DF_1 <- VCHsegments_DF %>% 
  filter(Segment_ID == 1) %>% 
  select(-Segment_ID) %>% 
  rename(Elv_1 = avg_Elv, VCH_1 = avg_VCH)

VCHsegments_DF_2 <- VCHsegments_DF %>% 
  filter(Segment_ID == 2) %>% 
  select(-Segment_ID) %>% 
  rename(Elv_2 = avg_Elv, VCH_2 = avg_VCH)

# Join the two types of the VCH segments. 
VCHsegments_DF <- merge(
  x = VCHsegments_DF_1,
  y = VCHsegments_DF_2,
  by = c("ET_ID", 
         groupName),
  all = FALSE
)

# Remove the segments without VCH (NAs).
VCHsegments_DF <- VCHsegments_DF %>% 
  drop_na()

summary(VCHsegments_DF)
nrow(VCHsegments_DF) # 376795 (extended) or 399414 (rotated).


# 5) Difference calculation. ----------------------------------------------

# NDVI difference: Upper - Lower.
NDVIsegments_DF <- NDVIsegments_DF %>% 
  mutate(
    Elv_Diff = Elv_1 - Elv_2,
    Diff_Sign = Elv_Diff / abs(Elv_Diff),
    NDVI_diff = (NDVI_1 - NDVI_2) * Diff_Sign
  ) %>% 
  select(all_of(c("ET_ID", groupName, "NDVI_diff")))

summary(NDVIsegments_DF)

# VCH difference: Upper - Lower.
VCHsegments_DF <- VCHsegments_DF %>% 
  mutate(
    Elv_Diff = Elv_1 - Elv_2,
    Diff_Sign = Elv_Diff / abs(Elv_Diff),
    VCH_diff = (VCH_1 - VCH_2) * Diff_Sign
  ) %>% 
  select(all_of(c("ET_ID", groupName, "VCH_diff")))

summary(VCHsegments_DF)

# Remove the NAs caused by "Elv_Diff == 0".
NDVIsegments_DF <- NDVIsegments_DF %>% 
  drop_na()

VCHsegments_DF <- VCHsegments_DF %>% 
  drop_na()

summary(NDVIsegments_DF)

summary(VCHsegments_DF)


# 6) Joining segments and transects. --------------------------------------

# Remove the transects with missing NDVI difference
#   in any segment pairs.
NDVIsegments_Spreaded <- NDVIsegments_DF %>% 
  spread(key = groupName, value = NDVI_diff) %>% 
  drop_na()

NDVIsegments_Spreaded %>% nrow() # 46301 (extended) or 66700 (rotated).

# Remove the transects with missing VCH difference
#   in any segment pairs.
VCHsegments_Spreaded <- VCHsegments_DF %>% 
  spread(key = groupName, value = VCH_diff) %>% 
  drop_na()

VCHsegments_Spreaded %>% nrow() # 45935 (extended) or 66412 (rotated).

# Rename the columns. 
NDVIsegments_Renamed <- NDVIsegments_Spreaded %>% 
  rename_with(.fn = ~ str_c("NDVI_", .), 
              .cols = -ET_ID)

summary(NDVIsegments_Renamed)

VCHsegments_Renamed <- VCHsegments_Spreaded %>% 
  rename_with(.fn = ~ str_c("VCH_", .), 
              .cols = -ET_ID)

summary(VCHsegments_Renamed)

## Join the segment variables with the sampled transects.
# NDVI differences.
sampled_RawNDVIdiff <- sampled_SHP %>% 
  mutate(NDVI_rawDiff = U_NDVI - L_NDVI) %>% 
  select(ET_ID, NDVI_rawDiff) %>% 
  drop_na()

sampled_RawNDVIdiff <- 
  sampled_RawNDVIdiff %>% 
  rename_at("NDVI_rawDiff", 
            ~ NDVI_rawDiff_VarName)

summary(sampled_RawNDVIdiff)
nrow(sampled_RawNDVIdiff) # 66744.

transects_NDVIdiff <- merge(
  x = sampled_RawNDVIdiff,
  y = NDVIsegments_Renamed,
  by = c("ET_ID"),
  all = FALSE
)

summary(transects_NDVIdiff)
nrow(transects_NDVIdiff) # 46301 (extended) or 66698 (rotated).

# VCH differences.
sampled_RawVCHdiff <- sampled_SHP %>% 
  mutate(VCH_rawDiff = U_CanopyHt - L_CanopyHt) %>% 
  select(ET_ID, VCH_rawDiff) %>% 
  drop_na()

sampled_RawVCHdiff <- 
  sampled_RawVCHdiff %>% 
  rename_at("VCH_rawDiff", 
            ~ VCH_rawDiff_VarName)

summary(sampled_RawVCHdiff)
nrow(sampled_RawVCHdiff) # 66602.

transects_VCHdiff <- merge(
  x = sampled_RawVCHdiff,
  y = VCHsegments_Renamed,
  by = c("ET_ID"),
  all = FALSE
)

summary(transects_VCHdiff)
nrow(transects_VCHdiff) # 45935 (extended) or 66404 (rotated).

# Combine the NDVI and VCH differences.
transects_TwoDiff <- merge(
  x = transects_NDVIdiff,
  y = st_drop_geometry(transects_VCHdiff),
  by = c("ET_ID"),
  all = FALSE
)

summary(transects_TwoDiff)
nrow(transects_TwoDiff) # 45872 (extended) or 66345 (rotated).


# 7) Result output. -------------------------------------------------------

# NDVI differences.
NDVIdiff_FN <- paste0(filePrefix, "Transects_NDVIdiff")

st_write(obj = transects_NDVIdiff,
         dsn = file.path(wd_Transects,
                         folderName,
                         NDVIdiff_FN),
         layer = NDVIdiff_FN,
         driver = "ESRI Shapefile")

# VCH differences.
VCHdiff_FN <- paste0(filePrefix, "Transects_VCHdiff")

st_write(obj = transects_VCHdiff,
         dsn = file.path(wd_Transects,
                         folderName,
                         VCHdiff_FN),
         layer = VCHdiff_FN,
         driver = "ESRI Shapefile")

# Two differences.
TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

st_write(obj = transects_TwoDiff,
         dsn = file.path(wd_Transects,
                         folderName,
                         TwoDiff_FN),
         layer = TwoDiff_FN,
         driver = "ESRI Shapefile")

