import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Wind,
  MapPin,
  Clock,
  Calendar,
  Activity,
  AlertCircle,
  Loader2,
  ChevronDown,
  Leaf,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TriangleAlert,
} from "lucide-react";

const pollutants = [
  { id: "PM2.5", name: "PM2.5" },
  { id: "PM10", name: "PM10" },
  { id: "NO2", name: "NO₂" },
  { id: "SO2", name: "SO₂" },
  { id: "CO", name: "CO" },
  { id: "O3", name: "O₃" },
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getAQIInfo = (aqi) => {
  if (aqi <= 50)
    return {
      category: "Good",
      color: "#34c759",
      bgLight: "rgba(52, 199, 89, 0.08)",
      bgMedium: "rgba(52, 199, 89, 0.12)",
      icon: ShieldCheck,
      description: "Air quality is satisfactory with little or no risk.",
    };
  if (aqi <= 100)
    return {
      category: "Moderate",
      color: "#ff9f0a",
      bgLight: "rgba(255, 159, 10, 0.08)",
      bgMedium: "rgba(255, 159, 10, 0.12)",
      icon: ShieldAlert,
      description:
        "Acceptable quality. Some pollutants may concern sensitive groups.",
    };
  if (aqi <= 200)
    return {
      category: "Poor",
      color: "#ff6723",
      bgLight: "rgba(255, 103, 35, 0.08)",
      bgMedium: "rgba(255, 103, 35, 0.12)",
      icon: TriangleAlert,
      description:
        "Health effects possible for sensitive groups. General public less likely affected.",
    };
  return {
    category: "Severe",
    color: "#ff3b30",
    bgLight: "rgba(255, 59, 48, 0.08)",
    bgMedium: "rgba(255, 59, 48, 0.12)",
    icon: ShieldX,
    description:
      "Health alert: everyone may experience serious health effects.",
  };
};

/* ─── Reusable Select Component ─── */
function SelectField({ label, icon: Icon, name, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#86868b",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={14} />
          {label}
        </span>
      </label>
      <div style={{ position: "relative" }}>
        <select
          name={name}
          value={value}
          onChange={onChange}
          required
          style={{
            width: "100%",
            padding: "14px 40px 14px 16px",
            borderRadius: "12px",
            border: "1px solid #e8e8ed",
            backgroundColor: "#fafafa",
            color: value ? "#1d1d1f" : "#86868b",
            fontSize: "15px",
            fontFamily: "inherit",
            fontWeight: 400,
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#0071e3";
            e.target.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.1)";
            e.target.style.backgroundColor = "#ffffff";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e8e8ed";
            e.target.style.boxShadow = "none";
            e.target.style.backgroundColor = "#fafafa";
          }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#86868b",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Reusable Number Input Component ─── */
function NumberField({ label, icon: Icon, name, value, onChange, min, max, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#86868b",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={14} />
          {label}
        </span>
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        placeholder={placeholder}
        required
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: "12px",
          border: "1px solid #e8e8ed",
          backgroundColor: "#fafafa",
          color: "#1d1d1f",
          fontSize: "15px",
          fontFamily: "inherit",
          fontWeight: 400,
          outline: "none",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#0071e3";
          e.target.style.boxShadow = "0 0 0 3px rgba(0, 113, 227, 0.1)";
          e.target.style.backgroundColor = "#ffffff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e8e8ed";
          e.target.style.boxShadow = "none";
          e.target.style.backgroundColor = "#fafafa";
        }}
      />
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const [metadata, setMetadata] = useState({ states: [], cities: [], cities_by_state: {} });
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [formData, setFormData] = useState({
    state: "",
    city: "",
    pollutant_id: "",
    hour: "",
    month: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await axios.get("https://predback.onrender.com/metadata");
        // Merge with safe default so cities_by_state is always an object
        setMetadata({ cities_by_state: {}, ...response.data });
      } catch (err) {
        setError("Failed to load location data. Please refresh the page.");
        console.error("Metadata Error:", err);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // When state changes, reset the city so stale city isn't carried over
    if (name === "state") {
      setFormData((prev) => ({ ...prev, state: value, city: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Build cities_by_state on the client if the backend didn't return it yet
  // (handles the case before the backend is redeployed)
  const citiesByState = Object.keys(metadata.cities_by_state).length > 0
    ? metadata.cities_by_state
    : metadata.city_state_pairs
      ? metadata.city_state_pairs.reduce((acc, { state, city }) => {
          if (!acc[state]) acc[state] = [];
          acc[state].push(city);
          return acc;
        }, {})
      : null;

  // Only show cities that belong to the currently selected state
  const filteredCities =
    formData.state && citiesByState?.[formData.state]
      ? citiesByState[formData.state]
      : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("https://predback.onrender.com/predict", {
        state: formData.state,
        city: formData.city,
        pollutant_id: formData.pollutant_id,
        hour: parseInt(formData.hour),
        month: parseInt(formData.month),
      });
      setResult(response.data);
    } catch (err) {
      setError(
        "Failed to get prediction. Please check your connection and try again."
      );
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.state &&
    formData.city &&
    formData.pollutant_id &&
    formData.hour &&
    formData.month;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Subtle top gradient bar ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #0071e3, #34c759, #ff9f0a, #ff3b30)",
          zIndex: 100,
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          width: "100%",
          padding: "20px 0",
          borderBottom: "1px solid #f5f5f7",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          position: "sticky",
          top: "3px",
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0071e3, #34c759)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wind size={18} color="#fff" />
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#1d1d1f",
                letterSpacing: "-0.02em",
              }}
            >
              AirQuality
            </span>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#86868b",
              background: "#f5f5f7",
              padding: "6px 12px",
              borderRadius: "100px",
              letterSpacing: "0.02em",
            }}
          >
            AI-Powered Predictions
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          textAlign: "center",
          padding: "80px 24px 40px",
          maxWidth: "680px",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #e8f5e9, #e3f2fd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Leaf size={28} color="#34c759" />
        </motion.div>
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          Air Quality Predictor
        </h1>
        <p
          style={{
            fontSize: "clamp(17px, 2vw, 21px)",
            color: "#86868b",
            fontWeight: 400,
            lineHeight: 1.5,
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          Predict pollution levels for any location using machine learning.
        </p>
      </motion.div>

      {/* ── Main Content ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          padding: "0 24px 100px",
        }}
      >
        {/* Loading state */}
        {metadataLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "60px 0",
            }}
          >
            <Loader2
              size={28}
              color="#0071e3"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p style={{ fontSize: "15px", color: "#86868b" }}>
              Loading location data…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        )}

        {/* ── Form Card ── */}
        {!metadataLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e8ed",
                borderRadius: "20px",
                padding: "36px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#1d1d1f",
                  marginBottom: "8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Enter Details
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: "#86868b",
                  marginBottom: "32px",
                }}
              >
                Select location, pollutant, and time to get a prediction.
              </p>

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  <SelectField
                    label="State"
                    icon={MapPin}
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Select a state"
                    options={metadata.states}
                  />
                  <SelectField
                    label="City"
                    icon={MapPin}
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={formData.state ? "Select a city" : "Select a state first"}
                    options={filteredCities}
                  />
                  <SelectField
                    label="Pollutant"
                    icon={Activity}
                    name="pollutant_id"
                    value={formData.pollutant_id}
                    onChange={handleInputChange}
                    placeholder="Select pollutant"
                    options={pollutants.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                  />
                  <SelectField
                    label="Month"
                    icon={Calendar}
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    placeholder="Select month"
                    options={months}
                  />
                  <NumberField
                    label="Hour (0–23)"
                    icon={Clock}
                    name="hour"
                    value={formData.hour}
                    onChange={handleInputChange}
                    min={0}
                    max={23}
                    placeholder="e.g. 14"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={!isFormValid || loading}
                  whileHover={isFormValid && !loading ? { scale: 1.01 } : {}}
                  whileTap={isFormValid && !loading ? { scale: 0.99 } : {}}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "none",
                    background: isFormValid
                      ? "#0071e3"
                      : "#e8e8ed",
                    color: isFormValid ? "#ffffff" : "#86868b",
                    fontSize: "17px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: isFormValid && !loading ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease",
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Analyzing…
                    </>
                  ) : (
                    "Predict Air Quality"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: "20px",
                padding: "16px 20px",
                borderRadius: "14px",
                background: "rgba(255, 59, 48, 0.06)",
                border: "1px solid rgba(255, 59, 48, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#ff3b30",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result ── */}
        <AnimatePresence>
          {result && (() => {
            const info = getAQIInfo(result.predicted_pollution);
            const StatusIcon = info.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ marginTop: "28px" }}
              >
                <div
                  style={{
                    border: "1px solid #e8e8ed",
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: "#ffffff",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Result header */}
                  <div
                    style={{
                      padding: "40px 36px",
                      textAlign: "center",
                      background: info.bgLight,
                      borderBottom: `1px solid ${info.bgMedium}`,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: info.bgMedium,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <StatusIcon size={26} color={info.color} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      style={{
                        fontSize: "clamp(48px, 8vw, 72px)",
                        fontWeight: 700,
                        color: "#1d1d1f",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                        marginBottom: "8px",
                      }}
                    >
                      {result.predicted_pollution}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 16px",
                          borderRadius: "100px",
                          backgroundColor: info.color,
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: 600,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {result.category || info.category}
                      </span>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      style={{
                        marginTop: "16px",
                        fontSize: "15px",
                        color: "#6e6e73",
                        maxWidth: "400px",
                        margin: "16px auto 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {info.description}
                    </motion.p>
                  </div>

                  {/* Details grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      borderTop: "none",
                    }}
                  >
                    {[
                      { label: "State", value: formData.state.replace(/_/g, " ") },
                      { label: "City", value: formData.city.replace(/_/g, " ") },
                      {
                        label: "Pollutant",
                        value:
                          pollutants.find((p) => p.id === formData.pollutant_id)
                            ?.name || formData.pollutant_id,
                      },
                      {
                        label: "Time",
                        value: `${months.find((m) => m.value === parseInt(formData.month))?.label || ""}, ${formData.hour}:00`,
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        style={{
                          padding: "20px 24px",
                          borderTop: "1px solid #f5f5f7",
                          borderRight: i % 2 === 0 ? "1px solid #f5f5f7" : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#86868b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: "4px",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 500,
                            color: "#1d1d1f",
                          }}
                        >
                          {item.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          width: "100%",
          borderTop: "1px solid #f5f5f7",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "#86868b" }}>
          Predictions are generated by a machine learning model and should be used for informational purposes only.
        </p>
      </footer>
    </div>
  );
}

export default App;
