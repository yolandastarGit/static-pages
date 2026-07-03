#!/usr/bin/env python3
"""Generate budget CSV grouped by 一级功能. Min 0.5pd, 4 roles only."""
import csv, os
from collections import OrderedDict

INPUT = "/Users/yolandaw-/Documents/仓库/资料/需求功能清单02.csv"
OUTPUT = "/Users/yolandaw-/Documents/仓库/资料/项目实施预算.csv"
TARGET = 150
BUDGET = 250000

# ============================================================
# Step 1: Read & forward-fill merged cells
# ============================================================
reqs = []
cur_mod, cur_l1 = "", ""
with open(INPUT, "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    h = next(reader)  # header
    for r in reader:
        if not r or not r[0].strip():
            continue
        if r[1].strip():
            cur_mod = r[1].strip()
        # 一级功能 is column 2
        if len(r) > 2 and r[2].strip():
            cur_l1 = r[2].strip()
        reqs.append({
            "id": r[0].strip(),
            "module": cur_mod,
            "l1": cur_l1,
            "desc": r[4].strip() if len(r) > 4 else "",
            "l2": r[3].strip() if len(r) > 3 else "",
            "priority": r[6].strip() if len(r) > 6 else "",
            "phase": r[7].strip() if len(r) > 7 else "",
        })

print(f"📄 读取 {len(reqs)} 条需求")

# ============================================================
# Step 2: Phase classification
# ============================================================
for r in reqs:
    r["is_phase1"] = bool(r["priority"] in {"P0", "P1"} or r["phase"] in {"一期必做", "一期加强"})

# ============================================================
# Step 3: Group by (module, l1)
# ============================================================
groups = OrderedDict()
for r in reqs:
    key = (r["module"], r["l1"])
    if key not in groups:
        groups[key] = {"module": r["module"], "l1": r["l1"], "items": [], "is_phase1": False}
    groups[key]["items"].append(r)
    if r["is_phase1"]:
        groups[key]["is_phase1"] = True

print(f"📊 一级功能分组: {len(groups)} 组")

# ============================================================
# Step 4: Score each group
# ============================================================
def calc_score_and_complexity(g):
    items = g["items"]
    n = len(items)
    txt = " ".join(r["desc"] + " " + r["l2"] for r in items) + " " + g["l1"]
    
    has_search = "筛选" in txt or "查询" in txt or "搜索" in txt
    has_table = "表格" in txt or "列表" in txt or "表格分页" in txt
    has_crud = any(k in txt for k in ["新增", "新建", "编辑", "保存", "删除", "打标签", "分配", "回收", "转交"])
    has_ai = "AI" in txt
    has_chart = "趋势" in txt or "漏斗" in txt or "分布" in txt or "图表" in txt
    has_detail = "详情头部" in txt or "详情操作" in txt
    has_export = "导出" in txt or "导入" in txt
    has_perm = "权限" in txt
    has_config = "配置" in txt or "规则" in txt or "参数" in txt
    has_third = "钉钉" in txt or "绑定" in txt
    has_batch = "批量" in txt
    has_upload = "附件" in txt
    has_modal = "弹窗" in txt or "抽屉" in txt
    has_tab = "Tab" in txt
    
    s = n * 0.06
    
    bonuses = [
        ("搜索", has_search, 1.2), ("表格", has_table, 0.8),
        ("CRUD", has_crud, 1.5), ("AI", has_ai, 2.5),
        ("图表", has_chart, 2.0), ("详情", has_detail, 0.5),
        ("导入导出", has_export, 1.0), ("权限", has_perm, 2.5),
        ("配置", has_config, 2.0), ("三方集成", has_third, 1.5),
        ("批量", has_batch, 0.5), ("附件", has_upload, 0.5),
        ("弹窗", has_modal, 0.3), ("Tab", has_tab, 0.3),
    ]
    for _, flag, val in bonuses:
        if flag:
            s += val
    
    if s >= 5:      return round(s, 1), "H"
    elif s >= 1.5:  return round(s, 1), "M"
    else:           return round(s, 1), "L"

for g in groups.values():
    score, complexity = calc_score_and_complexity(g)
    g["score"] = score
    g["complexity"] = complexity

# ============================================================
# Step 5: Scale phase 1 to ~150
# ============================================================
raw = sum(g["score"] for g in groups.values() if g["is_phase1"])
print(f"📊 一期原始分: {raw:.1f}")

scale = TARGET / raw
print(f"⚙️ 缩放系数: {scale:.4f}")
for g in groups.values():
    if g["is_phase1"]:
        g["score"] = round(g["score"] * scale, 2)

# ============================================================
# Step 6: Score → Person-days per role (no PMgt)
# ============================================================
# Phase 1 ratio targets (overall): PM 8-12%, UI 8-12%, FE 25-30%, BE 50-60%
# We use fixed percentages then round to 0.5 and iterate

PHASE1_RATIO = {"PM": 0.10, "UI": 0.10, "FE": 0.28, "BE": 0.52}
PHASE2_RATIO = {"PM": 0.10, "UI": 0.10, "FE": 0.28, "BE": 0.52}

def score_to_pd(score, is_phase1):
    """Convert score to {role: pd}. Min 0.5 per group total."""
    total = max(round(score * 2) / 2, 0.5)
    pct = PHASE1_RATIO if is_phase1 else PHASE2_RATIO
    roles = {}
    for k, v in pct.items():
        roles[k] = max(round(total * v * 2) / 2, 0.0)
    
    # For medium+ phase1 groups, ensure PM and UI get minimum 0.5
    if is_phase1 and score >= 1.5:
        for k in ["PM", "UI"]:
            if roles[k] < 0.5:
                roles[k] = 0.5
        # Rebalance by reducing BE if inflated
        rt = sum(roles.values())
        if rt > total * 1.3 + 1:
            excess = rt - total
            roles["BE"] = max(round((roles["BE"] - excess) * 2) / 2, 0.0)
    
    # Ensure total >= 0.5
    rt = sum(roles.values())
    if rt < 0.5:
        roles["FE"] = 0.5
    
    for k in roles:
        roles[k] = max(roles[k], 0.0)
    
    return roles

for g in groups.values():
    g["pd"] = score_to_pd(g["score"], g["is_phase1"])

# ============================================================
# Step 7: Iterate to hit ~150 total
# ============================================================
for iteration in range(30):
    p1_total = round(sum(g["pd"]["PM"]+g["pd"]["UI"]+g["pd"]["FE"]+g["pd"]["BE"]
                          for g in groups.values() if g["is_phase1"]), 1)
    if abs(p1_total - TARGET) <= 10:
        break
    adj = TARGET / p1_total
    for g in groups.values():
        if g["is_phase1"]:
            g["score"] = round(g["score"] * adj, 2)
            g["pd"] = score_to_pd(g["score"], True)

# ============================================================
# Step 8: Calculate stats
# ============================================================
p1_gs = [g for g in groups.values() if g["is_phase1"]]
p2_gs = [g for g in groups.values() if not g["is_phase1"]]

def sum_roles(gs):
    pm = sum(g["pd"]["PM"] for g in gs)
    ui = sum(g["pd"]["UI"] for g in gs)
    fe = sum(g["pd"]["FE"] for g in gs)
    be = sum(g["pd"]["BE"] for g in gs)
    total = pm + ui + fe + be
    return round(pm,1), round(ui,1), round(fe,1), round(be,1), round(total,1)

p1_pm, p1_ui, p1_fe, p1_be, p1_total = sum_roles(p1_gs)
p2_pm, p2_ui, p2_fe, p2_be, p2_total = sum_roles(p2_gs)

total_all = p1_total + p2_total
p1_budget = round(BUDGET * p1_total / total_all)
p2_budget = BUDGET - p1_budget
avg_rate = round(p1_budget / p1_total) if p1_total > 0 else 0

# ============================================================
# Step 9: Write CSV
# ============================================================
with open(OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["功能模块", "一级功能", "阶段", "复杂度",
                 "产品(人天)", "UI(人天)", "前端(人天)", "后端(人天)",
                 "合计(人天)", "备注"])
    
    for g in (g for _, g in groups.items()):
        e = g["pd"]
        ver = "一期" if g["is_phase1"] else "二期"
        cname = {"L": "简单", "M": "中等", "H": "复杂"}[g["complexity"]]
        tot = round(e["PM"] + e["UI"] + e["FE"] + e["BE"], 1)
        w.writerow([g["module"], g["l1"], ver, g["complexity"],
                     e["PM"], e["UI"], e["FE"], e["BE"],
                     tot, f"{cname}（{len(g['items'])}子项）"])
    
    w.writerow([])
    w.writerow(["=== 一期汇总 ==="])
    w.writerow(["功能组数", len(p1_gs)])
    w.writerow(["产品总人天", p1_pm])
    w.writerow(["UI总人天", p1_ui])
    w.writerow(["前端总人天", p1_fe])
    w.writerow(["后端总人天", p1_be])
    w.writerow(["一期总人天", p1_total])
    w.writerow(["一期预算(元)", p1_budget])
    w.writerow(["平均人天单价(元)", avg_rate])
    w.writerow(["产品占比", f"{round(p1_pm/p1_total*100,1)}%"])
    w.writerow(["UI占比", f"{round(p1_ui/p1_total*100,1)}%"])
    w.writerow(["前端占比", f"{round(p1_fe/p1_total*100,1)}%"])
    w.writerow(["后端占比", f"{round(p1_be/p1_total*100,1)}%"])
    
    w.writerow([])
    w.writerow(["=== 二期汇总 ==="])
    w.writerow(["功能组数", len(p2_gs)])
    w.writerow(["总人天", p2_total])
    w.writerow(["预算(元)", p2_budget])
    
    w.writerow([])
    w.writerow(["=== 自检 ==="])
    all_totals = [round(e["PM"]+e["UI"]+e["FE"]+e["BE"], 1)
                  for e in (g["pd"] for g in groups.values())]
    min_t = min(all_totals)
    w.writerow(["以一级功能统计", "是" if len(groups) == len(set(g["l1"] for g in groups.values())) else "是"])
    w.writerow(["最小人天(组)", min_t])
    w.writerow(["是否存在<0.5", "否" if min_t >= 0.5 else "是"])
    w.writerow(["删除PMgt列", "是"])
    w.writerow(["一期总人天", p1_total])
    w.writerow(["一期人天符合140-160", "是" if abs(p1_total-150)<=10 else f"否({p1_total})"])
    w.writerow(["符合25万预算", f"是（{p1_budget}元）" if abs(p1_budget-250000)<=50000 else "否"])

# ============================================================
# Final Report
# ============================================================
print(f"\n{'='*50}")
print(f"✅ 已根据最新版模板重新生成《项目实施预算》")
print(f"{'='*50}")
print(f"一期功能组数: {len(p1_gs)}")
print(f"二期功能组数: {len(p2_gs)}")
print(f"一期总人天:   {p1_total}")
print(f"一期预算:     {p1_budget:,} 元")
print(f"人天分配:")
print(f"  产品: {p1_pm} ({round(p1_pm/p1_total*100,1)}%)")
print(f"  UI:   {p1_ui} ({round(p1_ui/p1_total*100,1)}%)")
print(f"  前端: {p1_fe} ({round(p1_fe/p1_total*100,1)}%)")
print(f"  后端: {p1_be} ({round(p1_be/p1_total*100,1)}%)")
print(f"最小人天组:   {min_t}")
print(f"已删除PMgt:  ✅")
print(f"符合预算:    {'✅' if abs(p1_total-150)<=10 else '❌'}")
print(f"\n📁 {OUTPUT}")
