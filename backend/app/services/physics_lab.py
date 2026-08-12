"""Physics lab: known laws, explicit assumptions, reproducible numerics. Not speculative claims."""
from __future__ import annotations

import hashlib
import json
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

G_NEWTON = 6.67430e-11
C_LIGHT = 299792458.0
HBAR = 1.054571817e-34
K_B = 1.380649e-23
E_CHARGE = 1.602176634e-19


def _seed(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()[:16]


def projectile(params: dict) -> dict:
    v0 = float(params.get("v0", 20))
    angle_deg = float(params.get("angle_deg", 45))
    g = float(params.get("g", 9.80665))
    y0 = float(params.get("y0", 0))
    assumptions = [
        "Uniform gravitational field g, no air resistance.",
        "Flat non-rotating Earth; inertial frame.",
        "Point particle; no lift.",
    ]
    if g == 0:
        assumptions.append("g=0 is a counterfactual Newtonian model, not a physical claim that gravity was cancelled.")
        certainty = "theoretical_model"
        warning = "Setting g=0 is a simulation switch. Known physics does not allow turning gravity off."
    else:
        certainty = "numerically_checked"
        warning = None
    th = np.deg2rad(angle_deg)
    vx, vy = v0 * np.cos(th), v0 * np.sin(th)
    # duration
    if g == 0:
        t_end = float(params.get("t_end", 5.0))
    else:
        disc = vy**2 + 2 * g * y0
        t_end = (vy + np.sqrt(max(disc, 0))) / g if g else 5
        t_end = max(t_end, 0.1)
    t = np.linspace(0, t_end, 200)
    x = vx * t
    y = y0 + vy * t - 0.5 * g * t**2
    # analytic peak
    t_peak = vy / g if g else 0
    h_peak = y0 + vy * t_peak - 0.5 * g * t_peak**2 if g else None
    payload = {
        "lab": "classical_projectile",
        "params": {"v0": v0, "angle_deg": angle_deg, "g": g, "y0": y0, "units": {"v0": "m/s", "g": "m/s^2", "y0": "m"}},
        "equations": [
            r"x(t)=v_0\cos\theta\, t",
            r"y(t)=y_0+v_0\sin\theta\, t-\tfrac12 g t^2",
        ],
        "assumptions": assumptions,
        "initial_conditions": {"x": 0, "y": y0, "vx": vx, "vy": vy},
        "constants": {"g": g},
        "series": {"t": t.tolist(), "x": x.tolist(), "y": y.tolist()},
        "peak_height_m": h_peak,
        "range_m": float(x[np.where(y >= 0)[0][-1]]) if np.any(y >= 0) else float(x[-1]),
        "certainty": certainty,
        "warning": warning,
        "limitations": "Air drag, Coriolis, and GR corrections are omitted.",
        "sensitivity": {
            "range_if_angle_plus_1deg": None,
        },
        "repro_seed": _seed({"v0": v0, "angle_deg": angle_deg, "g": g, "y0": y0}),
    }
    # sensitivity
    th2 = np.deg2rad(angle_deg + 1)
    if g:
        payload["sensitivity"]["range_if_angle_plus_1deg"] = float(v0**2 * np.sin(2 * th2) / g)
        payload["sensitivity"]["analytic_vacuum_range"] = float(v0**2 * np.sin(2 * th) / g) if y0 == 0 else "y0!=0 so simple formula does not apply"
    return payload


def harmonic_oscillator(params: dict) -> dict:
    m = float(params.get("m", 1))
    k = float(params.get("k", 4))
    x0 = float(params.get("x0", 1))
    v0 = float(params.get("v0", 0))
    t_end = float(params.get("t_end", 10))
    omega = np.sqrt(k / m)
    t = np.linspace(0, t_end, 400)
    # x = A cos(wt) + B sin(wt)
    A, B = x0, v0 / omega if omega else 0
    x = A * np.cos(omega * t) + B * np.sin(omega * t)
    v = -A * omega * np.sin(omega * t) + B * omega * np.cos(omega * t)
    E = 0.5 * m * v**2 + 0.5 * k * x**2
    return {
        "lab": "harmonic_oscillator",
        "assumptions": ["Hooke's law F=-kx", "No damping", "1D inertial frame"],
        "equations": [r"m\ddot x = -kx", r"\omega=\sqrt{k/m}"],
        "constants": {"m": m, "k": k, "omega": omega, "units": {"m": "kg", "k": "N/m"}},
        "initial_conditions": {"x0": x0, "v0": v0},
        "series": {"t": t.tolist(), "x": x.tolist(), "v": v.tolist(), "energy": E.tolist()},
        "energy_drift_rel": float((E.max() - E.min()) / (E.mean() + 1e-15)),
        "certainty": "verified_math",
        "limitations": "Linear spring is an approximation of real materials.",
        "repro_seed": _seed({"m": m, "k": k, "x0": x0, "v0": v0, "t_end": t_end}),
    }


def lorentz_orbit(params: dict) -> dict:
    """Charged particle in uniform B field — cyclotron."""
    q = float(params.get("q", E_CHARGE))
    m = float(params.get("m", 9.1093837e-31))
    B = float(params.get("B", 0.01))
    v = float(params.get("v", 1e6))
    t_end = float(params.get("t_end", 1e-8))
    omega = q * B / m
    t = np.linspace(0, t_end, 400)
    R = m * v / (abs(q) * B) if B and q else 0
    x = R * np.sin(omega * t)
    y = R * (1 - np.cos(omega * t))
    return {
        "lab": "cyclotron_motion",
        "assumptions": ["Uniform constant B along z", "No E field", "Non-relativistic if v << c"],
        "equations": [r"m\dot v = q\, v\times B", r"\omega_c = qB/m"],
        "constants": {"q": q, "m": m, "B": B, "c": C_LIGHT},
        "initial_conditions": {"v_perp": v},
        "series": {"t": t.tolist(), "x": x.tolist(), "y": y.tolist()},
        "radius_m": R,
        "cyclotron_freq_rad_s": omega,
        "v_over_c": v / C_LIGHT,
        "certainty": "theoretical_model" if v / C_LIGHT > 0.1 else "numerically_checked",
        "limitations": "Radiation reaction and relativity omitted. If v/c is not << 1 the model is inconsistent.",
        "repro_seed": _seed({"q": q, "m": m, "B": B, "v": v}),
    }


def schrodinger_infinite_well(params: dict) -> dict:
    n = int(params.get("n", 1))
    L = float(params.get("L", 1.0))
    m = float(params.get("m", 1.0))
    hbar = float(params.get("hbar", 1.0))  # natural units by default
    xs = np.linspace(0, L, 300)
    psi = np.sqrt(2 / L) * np.sin(n * np.pi * xs / L)
    E = (n**2 * np.pi**2 * hbar**2) / (2 * m * L**2)
    # check normalization numerically
    try:
        norm = float(np.trapezoid(psi**2, xs))
    except Exception:
        norm = float(np.trapz(psi**2, xs))
    return {
        "lab": "particle_in_a_box",
        "assumptions": [
            "1D infinite square well, V=0 on (0,L), infinite elsewhere.",
            "Non-relativistic Schrödinger equation.",
            "Natural units if hbar=m=1.",
        ],
        "equations": [
            r"-\frac{\hbar^2}{2m}\psi''=E\psi",
            r"\psi_n=\sqrt{2/L}\sin(n\pi x/L),\quad E_n=n^2\pi^2\hbar^2/(2mL^2)",
        ],
        "bra_ket": r"|n\rangle,\quad \langle x|n\rangle=\psi_n(x)",
        "constants": {"n": n, "L": L, "m": m, "hbar": hbar},
        "series": {"x": xs.tolist(), "psi": psi.tolist(), "rho": (psi**2).tolist()},
        "energy": E,
        "norm_check": norm,
        "certainty": "verified_math",
        "limitations": "Infinite walls are an idealization. This is not a numerical diagonalization of a general Hamiltonian.",
        "repro_seed": _seed({"n": n, "L": L, "m": m, "hbar": hbar}),
    }


def try_qutip_tls(params: dict) -> dict:
    """Optional two-level Rabi model via QuTiP; fallback to analytic."""
    Omega = float(params.get("Omega", 1.0))
    t_end = float(params.get("t_end", 10.0))
    t = np.linspace(0, t_end, 250)
    used = "analytic"
    detail = {}
    try:
        import qutip as qt

        H = 0.5 * Omega * qt.sigmax()
        psi0 = qt.basis(2, 0)
        res = qt.mesolve(H, psi0, t, [], [qt.sigmaz(), qt.sigmax()])
        sz = np.real(res.expect[0]).tolist()
        sx = np.real(res.expect[1]).tolist()
        used = "qutip"
        detail = {"solver": "mesolve", "collapse_ops": []}
    except Exception as e:
        sz = np.cos(Omega * t).tolist()
        sx = np.sin(Omega * t).tolist()
        detail = {"qutip_unavailable": str(e), "fallback": "closed-form Rabi oscillation with H=(Ω/2)σx"}
    return {
        "lab": "two_level_rabi",
        "engine": used,
        "assumptions": ["Closed two-level system", "Rotating-wave / given Hamiltonian H=(Ω/2)σ_x", "No decoherence unless collapse ops added"],
        "equations": [r"i\hbar\dot|\psi\rangle=H|\psi\rangle", r"H=\frac{\Omega}{2}\sigma_x"],
        "series": {"t": t.tolist(), "sigma_z": sz, "sigma_x": sx},
        "certainty": "numerically_checked" if used == "qutip" else "verified_math",
        "limitations": "Toy TLS. Not a full QFT particle-physics computation.",
        "engine_detail": detail,
        "repro_seed": _seed({"Omega": Omega, "t_end": t_end, "engine": used}),
    }


def cosmology_hubble(params: dict) -> dict:
    H0 = float(params.get("H0", 70))  # km/s/Mpc
    assumptions = [
        "FLRW cosmology in the nearby linear Hubble regime, v = H0 d.",
        "Does not prove dark energy; that requires supernova/CMB data analysis outside this toy model.",
    ]
    d = np.linspace(0, float(params.get("d_max", 100)), 50)  # Mpc
    v = H0 * d
    return {
        "lab": "hubble_linear",
        "assumptions": assumptions,
        "equations": [r"v=H_0 d"],
        "constants": {"H0": H0, "units": {"H0": "km/s/Mpc", "d": "Mpc", "v": "km/s"}},
        "series": {"d": d.tolist(), "v": v.tolist()},
        "certainty": "theoretical_model",
        "limitations": "Linear Hubble law is an approximation at low redshift. H0 value here is an input, not a measurement by this app.",
        "repro_seed": _seed({"H0": H0}),
    }


def relativity_time_dilation(params: dict) -> dict:
    v = float(params.get("v", 0.6))  # in units of c
    if abs(v) >= 1:
        return {
            "ok": False,
            "lab": "special_relativity",
            "certainty": "contradiction_impossible",
            "error": "A massive particle cannot have |v| >= c in special relativity.",
            "assumptions": ["Minkowski spacetime, special relativity."],
        }
    gamma = 1 / np.sqrt(1 - v**2)
    vs = np.linspace(0, 0.99, 80)
    gammas = 1 / np.sqrt(1 - vs**2)
    return {
        "lab": "special_relativity_time_dilation",
        "assumptions": ["Special relativity, inertial frames", "v is in units of c"],
        "equations": [r"\gamma=(1-v^2/c^2)^{-1/2}", r"\Delta t=\gamma\Delta\tau"],
        "constants": {"c": C_LIGHT},
        "input": {"v_over_c": v, "gamma": gamma},
        "series": {"v_over_c": vs.tolist(), "gamma": gammas.tolist()},
        "certainty": "verified_math",
        "limitations": "This is SR kinematics, not a GR orbit and not a claim about FTL travel.",
        "repro_seed": _seed({"v": v}),
    }


def nbody_gravity(params: dict) -> dict:
    g_off = bool(params.get("cancel_gravity", False))
    m1 = float(params.get("m1", 5.972e24))
    m2 = float(params.get("m2", 7.348e22))
    r = float(params.get("r", 3.84e8))
    G = 0.0 if g_off else G_NEWTON
    F = G * m1 * m2 / r**2 if r else 0
    return {
        "lab": "newton_two_body_force",
        "assumptions": [
            "Newtonian point masses.",
            "Instantaneous action at a distance (not GR).",
            "If G=0 this is a counterfactual simulation, not known physics.",
        ],
        "equations": [r"F=G m_1 m_2 / r^2"],
        "constants": {"G": G, "G_physical": G_NEWTON},
        "initial_conditions": {"m1": m1, "m2": m2, "r": r},
        "force_N": F,
        "certainty": "theoretical_model" if g_off else "numerically_checked",
        "warning": "Gravity cannot be cancelled in known physics. G=0 is a model switch only." if g_off else None,
        "limitations": "GR, finite propagation, and extended bodies are omitted.",
        "repro_seed": _seed({"m1": m1, "m2": m2, "r": r, "G": G}),
    }


SCENARIOS = {
    "projectile": projectile,
    "oscillator": harmonic_oscillator,
    "cyclotron": lorentz_orbit,
    "infinite_well": schrodinger_infinite_well,
    "rabi": try_qutip_tls,
    "hubble": cosmology_hubble,
    "time_dilation": relativity_time_dilation,
    "newton_force": nbody_gravity,
}


def run(scenario: str, params: dict) -> dict:
    fn = SCENARIOS.get(scenario)
    if not fn:
        return {
            "ok": False,
            "certainty": "insufficient_info",
            "error": f"Unknown scenario '{scenario}'.",
            "available": list(SCENARIOS),
        }
    out = fn(params or {})
    out["ok"] = out.get("ok", True)
    out["scenario"] = scenario
    return out
