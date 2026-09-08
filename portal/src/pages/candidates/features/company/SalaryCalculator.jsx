import React, { useState } from "react";
import {
  FaCalculator, FaCheckCircle, FaInfoCircle, FaRupeeSign
} from "react-icons/fa";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./CompanyResearch.css";

const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const SalaryCalculator = () => {
  const [ctc, setCtc] = useState("");
  const [basePct, setBasePct] = useState(50);
  const [hraPct, setHraPct] = useState(20);
  const [taxRate, setTaxRate] = useState(20);

  const ctcNum = parseFloat(ctc) || 0;
  const annualHra = (ctcNum * hraPct) / 100;
  const annualBase = (ctcNum * basePct) / 100;
  const yearlyDeductions = (ctcNum * taxRate) / 100;
  const annualTakeHome = Math.max(0, ctcNum - yearlyDeductions);
  const monthlyTakeHome = annualTakeHome / 12;
  const takeHomePct = ctcNum > 0 ? Math.round((annualTakeHome / ctcNum) * 100) : 0;

  return (
    <div className="cr-root">
      <LandingHeader />
      <main className="cr-main">
        <section className="cr-hero cr-hero--salary">
          <div className="cr-hero__badge">
            <FaCalculator /> Salary Calculator
          </div>
          <h1>Salary Calculator</h1>
          <p>
            Estimate your in-hand salary, monthly take-home pay and tax deductions
            from your offered CTC in a few simple steps.
          </p>
        </section>

        <section className="cr-section cr-section--wide">
          <div className="cr-calc">
            <div className="cr-calc__form">
              <label className="cr-field">
                <span>Annual CTC (₹)</span>
                <div className="cr-field__input">
                  <FaRupeeSign />
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1200000"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                  />
                </div>
              </label>

              <label className="cr-field">
                <span>Basic salary share: <b>{basePct}%</b></span>
                <input
                  type="range" min="20" max="80" step="1"
                  value={basePct}
                  onChange={(e) => setBasePct(Number(e.target.value))}
                />
              </label>

              <label className="cr-field">
                <span>HRA share: <b>{hraPct}%</b></span>
                <input
                  type="range" min="0" max="50" step="1"
                  value={hraPct}
                  onChange={(e) => setHraPct(Number(e.target.value))}
                />
              </label>

              <label className="cr-field">
                <span>Annual tax deduction: <b>{taxRate}%</b></span>
                <input
                  type="range" min="0" max="45" step="1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </label>

              <p className="cr-calc__note">
                <FaInfoCircle /> Estimates are indicative. Actual numbers depend on
                income slabs, exemptions and employer contributions.
              </p>
            </div>

            <div className="cr-calc__result">
              <div className="cr-calc__result-head">
                <FaCheckCircle /> Salary breakup
              </div>
              <div className="cr-calc__rows">
                <div className="cr-calc__row">
                  <span>Annual CTC</span>
                  <b>{formatINR(ctcNum)}</b>
                </div>
                <div className="cr-calc__row">
                  <span>Annual basic</span>
                  <b>{formatINR(annualBase)}</b>
                </div>
                <div className="cr-calc__row">
                  <span>Annual HRA</span>
                  <b>{formatINR(annualHra)}</b>
                </div>
                <div className="cr-calc__row">
                  <span>Yearly deductions</span>
                  <b className="cr-calc__deduct">- {formatINR(yearlyDeductions)}</b>
                </div>
              </div>
              <div className="cr-calc__takehome">
                <h4>In-hand salary</h4>
                <p>
                  <FaRupeeSign />
                  {ctcNum > 0
                    ? Math.round(monthlyTakeHome).toLocaleString("en-IN")
                    : "0"}
                  <span>/month</span>
                </p>
                <small>{formatINR(annualTakeHome)} per year</small>
                <em>You take home {takeHomePct}% of your CTC</em>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default SalaryCalculator;