# Introduction. -----------------------------------------------------------

# 1) Create a box plot of the NDVI/VCH differences between the upper and lower
#   segments of the rotated transect samples.

# Updated: 02/29/2024.


# 0) Setup. ---------------------------------------------------------------

# Load Packages.
library(tidyverse)
library(sf)

# Set the theme of plots.
theme_set(theme_bw())

# Define the working directories.
wd_Transects <- "Your-File-Path"
# (Please update this file path with the location where
#   the relevant datasets of transect samples are stored.)

wd_Figs <- 
  file.path(wd_Transects,
            "Figures")


# 1) Dataset loading. -----------------------------------------------------

# Load the NDVI/VCH differences of the rotated transects.
filePrefix <- "rotated"

TwoDiff_FN <- paste0(filePrefix, "Transects_TwoDiff")

transects_TwoDiff_SHP <- st_read(
  file.path(wd_Transects,
            TwoDiff_FN),
  layer = TwoDiff_FN,
  stringsAsFactors = TRUE)

# Check the loaded dataset.
nrow(transects_TwoDiff_SHP) # 66345.
summary(transects_TwoDiff_SHP)


# 2) NDVI difference preprocessing. ---------------------------------------

# Define the variable name and prefix.
varName <- "NDVI"
prefix <- paste0(varName, "_")

# Select the NDVI differences.
transects_NDVIdiff_DF <- 
  transects_TwoDiff_SHP|> 
  select(ET_ID | starts_with(prefix))|> 
  st_drop_geometry()

colnames(transects_NDVIdiff_DF)

# Rename the columns.
transects_NDVIdiff_Renamed <- 
  transects_NDVIdiff_DF|> 
  rename_with(.fn = ~ gsub(prefix, "", .), # Remove the prefix.
              .cols = -ET_ID)|> 
  rename_with(.fn = ~ gsub("\\.", "-", .), # Replace "." with "-".
              .cols = -ET_ID)|> 
  rename_with(.fn = ~ str_c(., "°"), # Add a "°" at the end.
              .cols = -ET_ID)

colnames(transects_NDVIdiff_Renamed)

# Rearrange the dataset.
transects_NDVIdiff_Gathered <- 
  transects_NDVIdiff_Renamed|> 
  gather(key = "Angle", 
         value = "Difference", 
         -ET_ID)|> 
  mutate(Type = varName)

head(transects_NDVIdiff_Gathered)


# 3) VCH difference preprocessing. ----------------------------------------

# Define the variable name and prefix.
varName <- "VCH"
prefix <- paste0(varName, "_")

# Select the VCH differences.
transects_VCHdiff_DF <- 
  transects_TwoDiff_SHP|> 
  select(ET_ID | starts_with(prefix))|> 
  st_drop_geometry()

colnames(transects_VCHdiff_DF)

# Rename the columns. 
transects_VCHdiff_Renamed <- 
  transects_VCHdiff_DF|> 
  rename_with(.fn = ~ gsub(prefix, "", .), # Remove the prefix.
              .cols = -ET_ID)|> 
  rename_with(.fn = ~ gsub("\\.", "-", .), # Replace "." with "-".
              .cols = -ET_ID)|> 
  rename_with(.fn = ~ str_c(., "°"), # Add a "°" at the end.
              .cols = -ET_ID)

colnames(transects_VCHdiff_Renamed)

# Rearrange the dataset.
transects_VCHdiff_Gathered <- 
  transects_VCHdiff_Renamed|> 
  gather(key = "Angle", 
         value = "Difference", 
         -ET_ID)|> 
  mutate(Type = varName)

head(transects_VCHdiff_Gathered)


# 4) Dataset combination. -------------------------------------------------

# Coefficient used to scale the NDVI difference.
coeff <- 38

# Transform the NDVI difference.
transects_NDVIdiff_Transformed <- 
  transects_NDVIdiff_Gathered

transects_NDVIdiff_Transformed$Difference <- 
  transects_NDVIdiff_Transformed$Difference * coeff

# Combine the two differences.
transects_TwoDiff_Processed <- 
  rbind(transects_NDVIdiff_Transformed, 
        transects_VCHdiff_Gathered)

# Change the format and level orders of "Angle" and "Type"
#   for a better visualization.
transects_TwoDiff_Processed$Angle <- factor(
  transects_TwoDiff_Processed$Angle, 
  c("-90°", "-60°", "-30°", "0°", "30°", "60°", "90°"))

transects_TwoDiff_Processed$Type <- factor(
  transects_TwoDiff_Processed$Type, 
  levels = c("VCH", "NDVI"))

summary(transects_TwoDiff_Processed)


# 5) Segment difference plotting. -----------------------------------------

# Set the colors.
VCH_fill <- "lightblue"
VCH_color <- "darkblue"

NDVI_fill <- "lightgreen"
NDVI_color <- "darkgreen"

# Make a box plot.
boxplot <- 
  ggplot(transects_TwoDiff_Processed) +
  geom_boxplot(
    mapping = aes(x = Angle, y = Difference, 
                  fill = Type, color = Type), 
    position = position_dodge(0.5), 
    width = 0.5, 
    outlier.shape = NA) + 
  geom_hline(yintercept = 0,
             color = "red", alpha = 0.5,
             lty = "dashed", lwd = 0.5) + 
  xlab("Angle") +
  scale_y_continuous(
    # Features of the first Y-axis (VCH).
    name = "Canopy height difference (m)",
    limits = c(-16, 8),
    breaks = seq(-15, 5, by = 5),
    
    # Add a second Y-axis (NDVI) and specify its features.
    sec.axis = sec_axis(~ . / coeff, 
                        name = "NDVI difference")
  ) +
  scale_color_manual(
    values = c(VCH_color, NDVI_color)
    ) +
  scale_fill_manual(
    values = c(VCH_fill, NDVI_fill)
    ) +
  theme(
    # First Y-axis (VCH).
    axis.title.y = element_text(color = VCH_color),
    axis.text.y = element_text(color = VCH_color),
    axis.ticks.y = element_line(color = VCH_color),
    axis.line.y = element_line(color = VCH_color),
    
    # Second Y-axis (NDVI).
    axis.title.y.right = element_text(color = NDVI_color),
    axis.text.y.right = element_text(color = NDVI_color),
    axis.ticks.y.right = element_line(color = NDVI_color),
    axis.line.y.right = element_line(color = NDVI_color),
    
    # All axes.
    axis.title = element_text(face = "bold"),
    
    # Legend.
    legend.position = "none"
  )

boxplot

# Output the box plot.
if (!dir.exists(wd_Figs)) {
  dir.create(wd_Figs)
}

png(filename = file.path(
  wd_Figs, 
  paste0(filePrefix, "TwoDiff_Boxplot.png")), 
  width = 3000, height = 2000, 
  units = "px", res = 600)
boxplot
dev.off()

