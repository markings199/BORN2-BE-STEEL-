/* Sample W-shapes (in, in², in⁴, in³); verify against AISC Manual for production. */
const sections = [
  {
    designation: "W12x19",
    weightPlf: 19,
    d: 12.2,
    bf: 4.01,
    tw: 0.235,
    tf: 0.35,
    Ag: 5.57,
    Ix: 130,
    Sx: 21.3,
    Zx: 24.7,
    rx: 4.82,
    Iy: 13.6,
    Sy: 3.76,
    Zy: 5.86,
    ry: 1.56,
  },
  {
    designation: "W18x50",
    weightPlf: 50,
    d: 18,
    bf: 7.495,
    tw: 0.355,
    tf: 0.57,
    Ag: 14.7,
    Ix: 800,
    Sx: 88.9,
    Zx: 101,
    rx: 7.38,
    Iy: 60.8,
    Sy: 16.2,
    Zy: 24.9,
    ry: 2.03,
  },
  {
    designation: "W24x62",
    weightPlf: 62,
    d: 23.7,
    bf: 7.04,
    tw: 0.43,
    tf: 0.59,
    Ag: 18.2,
    Ix: 1550,
    Sx: 131,
    Zx: 153,
    rx: 9.23,
    Iy: 34.5,
    Sy: 9.8,
    Zy: 15.7,
    ry: 1.38,
  },
];

const byDesignation = new Map(
  sections.map((s) => [s.designation.toUpperCase(), s])
);

function listSections() {
  return sections.map(({ designation, weightPlf, Ag, d, bf }) => ({
    designation,
    weightPlf,
    Ag,
    d,
    bf,
  }));
}

function getSection(designation) {
  if (!designation || typeof designation !== "string") return null;
  return byDesignation.get(designation.trim().toUpperCase()) || null;
}

module.exports = { sections, listSections, getSection };
