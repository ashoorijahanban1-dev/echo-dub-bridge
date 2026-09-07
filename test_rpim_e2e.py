"""
End-to-End (E2E) Verification Test for RPIM TV Web Platform
Verifies live deployment, brand alignment, removal of admin clutter/buzzwords, and course routing.
"""

import sys
import ssl
import json
import urllib.request
from typing import Tuple, List

BASE_URL = "https://rpim.ir"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_url(path: str) -> Tuple[int, str]:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RPIM-E2E-Tester/1.0"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            return resp.status, content
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return 500, str(e)

def run_e2e_tests() -> bool:
    all_passed = True
    print("=" * 60)
    print("STARTING E2E TEST SUITE FOR RPIM TV (https://rpim.ir)")
    print("=" * 60)

    # Test 1: Homepage Live & Status 200
    status, home_html = fetch_url("/")
    print(f"\n[Test 1] Homepage HTTP Status: {status}")
    if status != 200:
        print("  FAIL: Expected 200 OK for Homepage")
        return False
    print("  PASS: Homepage responded with HTTP 200")

    # Test 2: Brand Identity Verification
    print("\n[Test 2] Brand Identity & Television Media Verification:")
    expected_keywords = [
        ("RPIM TV", "RPIM TV Brand Title"),
        ("تماشای آنلاین", "Online Streaming CTA"),
        ("آرشیو دوره‌ها", "Course Archive Link")
    ]
    for kw, label in expected_keywords:
        if kw in home_html:
            print(f"  PASS: Found '{kw}' ({label})")
        else:
            print(f"  FAIL: Expected '{kw}' ({label}) in homepage HTML")
            all_passed = False

    # Test 3: Clutter & Buzzword Removal Verification (Negative Assertions)
    print("\n[Test 3] Clutter & Admin Buzzword Removal Verification:")
    forbidden_terms = [
        ("استودیوی دوبله AI", "Public Studio button in Navbar"),
        ("دوبله صدم‌ثانیه‌ای Gemini 3", "AI Bragging buzzword"),
        ("دوبله جلسه جدید", "Admin dubbing trigger button"),
        ("موتور دوبله Gemini 3 Flash", "Exposed backend model tag in Footer")
    ]
    for term, label in forbidden_terms:
        if term not in home_html:
            print(f"  PASS: Clean! '{term}' ({label}) is NOT present")
        else:
            print(f"  FAIL: Found unexpected clutter '{term}' ({label}) in homepage HTML")
            all_passed = False

    # Test 4: Course Catalog Page
    print("\n[Test 4] Courses Catalog Route (/courses):")
    cat_status, cat_html = fetch_url("/courses")
    if cat_status == 200 and "کاتالوگ دوره‌های آموزشی" in cat_html:
        print("  PASS: Courses catalog loaded successfully with 200 OK")
    else:
        print(f"  FAIL: Courses catalog returned {cat_status} or missing expected title")
        all_passed = False

    # Test 5: Admin Login Authentication & Session
    print("\n[Test 5] Admin Login & Session Authentication (/api/admin/login):")
    login_url = f"{BASE_URL}/api/admin/login"
    login_data = json.dumps({"password": "admin123456"}).encode("utf-8")
    login_req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RPIM-E2E-Tester/1.0"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(login_req, context=ctx, timeout=15) as resp:
            login_resp_data = json.loads(resp.read().decode("utf-8"))
            cookie_header = resp.headers.get("Set-Cookie", "")
            if resp.status == 200 and "echodub_admin_token" in cookie_header:
                print("  PASS: Admin login successful (200 OK) and session cookie received")
                
                # Verify /admin dashboard access with the session cookie
                admin_cookie = cookie_header.split(";")[0]
                dash_req = urllib.request.Request(
                    f"{BASE_URL}/admin",
                    headers={
                        "Cookie": admin_cookie,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RPIM-E2E-Tester/1.0"
                    }
                )
                with urllib.request.urlopen(dash_req, context=ctx, timeout=15) as dash_resp:
                    if dash_resp.status == 200:
                        print("  PASS: Admin dashboard (/admin) accessed successfully with authenticated session")
                    else:
                        print(f"  FAIL: Admin dashboard returned status {dash_resp.status}")
                        all_passed = False
            else:
                print(f"  FAIL: Admin login returned status {resp.status} without expected cookie")
                all_passed = False
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"  FAIL: Admin login HTTP {e.code}: {err_body}")
        all_passed = False
    except Exception as e:
        print(f"  FAIL: Admin login error: {e}")
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("ALL E2E TESTS PASSED SUCCESSFULLY! The live site is clean and aligned.")
    else:
        print("SOME E2E TESTS FAILED! Review the errors above.")
    print("=" * 60)
    return all_passed

if __name__ == "__main__":
    success = run_e2e_tests()
    sys.exit(0 if success else 1)
