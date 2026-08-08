const BODY_TYPES = [
    { value: "lean_thin", label: "Lean / Thin Frame" },
    { value: "athletic_defined", label: "Athletic / Well Defined" },
    { value: "medium_frame", label: "Medium Frame" },
    { value: "soft_round", label: "Soft / Round Body" },
];

const BODY_TYPE_VALUES = BODY_TYPES.map((b) => b.value);

module.exports = { BODY_TYPES, BODY_TYPE_VALUES };
