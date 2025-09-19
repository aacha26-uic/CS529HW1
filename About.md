White-Hat Visualization Design Rationale
=======================================

To ethically update the visual encoding for this project, I focused on making the map both perceptually accurate and accessible. I used a colorblind-friendly sequential palette (BuPu from ColorBrewer2) to encode gun deaths per 100,000 people {while also showing the total death count}, ensuring that the color scale reflects normalized risk rather than raw counts, which allows for fair comparison between states of different population sizes. The legend and tooltips were updated to clearly communicate both the raw death count and the normalized rate, providing transparency and supporting honest interpretation. City markers were sized by area (not radius) to accurately represent the magnitude of deaths, and tooltips were added for both states and cities to provide on-demand details. The bottom plot was redesigned to support gender-based analysis, further enhancing the ethical and analytical value of the visualization.

This visualization is "white-hat" because it prioritizes clarity, fairness, and accessibility. All encodings are chosen to avoid misleading the viewer: color bins are based on quantiles for perceptual balance, legends are honest and unambiguous, and all data is normalized to prevent population bias. The design avoids sensationalism and instead empowers users to make informed, ethical interpretations. 

Sources and Credits:
- ColorBrewer2 (https://colorbrewer2.org/) for color palette selection and perceptual guidance.
- D3.js documentation and examples (https://d3js.org/).
- UIC CS529 course support code and assignment instructions.
- Inspiration for area-based encoding: "The Visual Display of Quantitative Information" by Edward Tufte.
- General best practices from "Visualization Analysis and Design" by Tamara Munzner.
<img width="1718" height="942" alt="image" src="https://github.com/user-attachments/assets/7c634168-97f1-488e-8202-cc86bd4e0216" />
