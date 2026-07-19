#!/usr/bin/env python3
"""
Backend API test for Graamam Connect privacy fix.
Tests that real customer/recipe data has been replaced with dummy data.
"""
import requests
import sys
import json
from typing import List, Dict, Any

BASE_URL = "https://connect-preview-12.preview.emergentagent.com/api"

# Real customer names that should NOT appear anywhere
FORBIDDEN_NAMES = ["Beruru", "Umariyam", "Annapurna", "Saravana"]

class GraamamPrivacyTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []

    def test(self, name: str, condition: bool, error_msg: str = ""):
        """Run a single test assertion"""
        self.tests_run += 1
        if condition:
            self.tests_passed += 1
            print(f"✅ PASS: {name}")
            return True
        else:
            print(f"❌ FAIL: {name}")
            if error_msg:
                print(f"   → {error_msg}")
            self.issues.append(f"{name}: {error_msg}")
            return False

    def check_forbidden_names(self, data: Any, context: str) -> bool:
        """Recursively check if any forbidden names appear in data"""
        data_str = json.dumps(data).lower()
        found = []
        for name in FORBIDDEN_NAMES:
            if name.lower() in data_str:
                found.append(name)
        
        if found:
            self.test(
                f"No real names in {context}",
                False,
                f"Found forbidden names: {', '.join(found)}"
            )
            return False
        else:
            self.test(f"No real names in {context}", True)
            return True

    def test_b2b_customers(self):
        """Test B2B customers are dummy data only"""
        print("\n🔍 Testing B2B Customers...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/master/customers/b2b", timeout=10)
            self.test("B2B customers API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                customers = resp.json()
                self.test("B2B customers count is 2", len(customers) == 2,
                         f"Expected 2, got {len(customers)}")
                
                # Check for expected dummy customers
                names = [c.get("name", "") for c in customers]
                self.test("Demo Foods Pvt Ltd present", "Demo Foods Pvt Ltd" in names)
                self.test("Sample Traders LLP present", "Sample Traders LLP" in names)
                
                # Check states
                for c in customers:
                    if c.get("name") == "Demo Foods Pvt Ltd":
                        self.test("Demo Foods state is Andhra Pradesh", 
                                 c.get("state") == "Andhra Pradesh",
                                 f"Got: {c.get('state')}")
                        self.test("Demo Foods GSTIN present", 
                                 c.get("gstin", "").startswith("37"),
                                 f"GSTIN: {c.get('gstin')}")
                    elif c.get("name") == "Sample Traders LLP":
                        self.test("Sample Traders state is Karnataka",
                                 c.get("state") == "Karnataka",
                                 f"Got: {c.get('state')}")
                        self.test("Sample Traders GSTIN present",
                                 c.get("gstin", "").startswith("29"),
                                 f"GSTIN: {c.get('gstin')}")
                
                # Check for forbidden names
                self.check_forbidden_names(customers, "B2B customers")
                
        except Exception as e:
            self.test("B2B customers API call", False, str(e))

    def test_b2c_customers(self):
        """Test B2C customers are dummy data only"""
        print("\n🔍 Testing B2C Customers...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/master/customers/b2c", timeout=10)
            self.test("B2C customers API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                customers = resp.json()
                self.test("B2C customers count is 2", len(customers) == 2,
                         f"Expected 2, got {len(customers)}")
                
                # Check for expected dummy customers
                names = [c.get("name", "") for c in customers]
                self.test("Demo Customer One present", "Demo Customer One" in names)
                self.test("Demo Customer Two present", "Demo Customer Two" in names)
                
                # Check for forbidden names
                self.check_forbidden_names(customers, "B2C customers")
                
        except Exception as e:
            self.test("B2C customers API call", False, str(e))

    def test_products_intact(self):
        """Test that products data is still intact (132 products)"""
        print("\n🔍 Testing Products Data Integrity...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/master/products", timeout=10)
            self.test("Products API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                products = resp.json()
                self.test("Products count is 132", len(products) == 132,
                         f"Expected 132, got {len(products)}")
                
                # Check for some known products
                names = [p.get("name", "") for p in products]
                self.test("Millet crispies - Classic present", 
                         "Millet crispies - Classic" in names)
                self.test("Millet Crispies - Coriander present",
                         "Millet Crispies - Coriander" in names)
                self.test("Millet Crispies - Garlic present",
                         "Millet Crispies - Garlic" in names)
                
        except Exception as e:
            self.test("Products API call", False, str(e))

    def test_costing_intact(self):
        """Test that costing data is still intact (55 rows)"""
        print("\n🔍 Testing Costing Data Integrity...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/master/costing", timeout=10)
            self.test("Costing API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                costing = resp.json()
                self.test("Costing count is 55", len(costing) == 55,
                         f"Expected 55, got {len(costing)}")
                
        except Exception as e:
            self.test("Costing API call", False, str(e))

    def test_gst_computation_intra_state(self):
        """Test GST computation for intra-state (CGST + SGST)"""
        print("\n🔍 Testing GST Computation (Intra-State)...")
        try:
            # Create invoice for Demo Foods Pvt Ltd (Andhra Pradesh - same state as company)
            payload = {
                "order_id": "TEST-INTRA-001",
                "customer_name": "Demo Foods Pvt Ltd",
                "customer_gstin": "37AABCD1234E1Z5",
                "customer_state": "Andhra Pradesh",
                "line_items": [
                    {
                        "name": "Millet crispies - Classic",
                        "hsn": "1904",
                        "qty": 10,
                        "rate": 100.0,
                        "gst": 5
                    }
                ],
                "place_of_supply": "Andhra Pradesh"
            }
            
            resp = requests.post(f"{BASE_URL}/graamam/invoices", json=payload, timeout=10)
            self.test("Intra-state invoice creation", resp.status_code == 201,
                     f"Status: {resp.status_code}")
            
            if resp.status_code == 201:
                invoice = resp.json()
                self.test("Tax type is intra", invoice.get("tax_type") == "intra",
                         f"Got: {invoice.get('tax_type')}")
                
                totals = invoice.get("totals", {})
                # Taxable = 10 * 100 = 1000
                # GST 5% = 50, split as CGST 25 + SGST 25
                self.test("CGST is 25.0", totals.get("cgst") == 25.0,
                         f"Got: {totals.get('cgst')}")
                self.test("SGST is 25.0", totals.get("sgst") == 25.0,
                         f"Got: {totals.get('sgst')}")
                self.test("IGST is 0.0", totals.get("igst") == 0.0,
                         f"Got: {totals.get('igst')}")
                self.test("Grand total is 1050", totals.get("final") == 1050,
                         f"Got: {totals.get('final')}")
                
        except Exception as e:
            self.test("Intra-state GST computation", False, str(e))

    def test_gst_computation_inter_state(self):
        """Test GST computation for inter-state (IGST only)"""
        print("\n🔍 Testing GST Computation (Inter-State)...")
        try:
            # Create invoice for Sample Traders LLP (Karnataka - different state)
            payload = {
                "order_id": "TEST-INTER-001",
                "customer_name": "Sample Traders LLP",
                "customer_gstin": "29AABCD5678F1Z3",
                "customer_state": "Karnataka",
                "line_items": [
                    {
                        "name": "Millet Crispies - Garlic",
                        "hsn": "1904",
                        "qty": 10,
                        "rate": 100.0,
                        "gst": 5
                    }
                ],
                "place_of_supply": "Karnataka"
            }
            
            resp = requests.post(f"{BASE_URL}/graamam/invoices", json=payload, timeout=10)
            self.test("Inter-state invoice creation", resp.status_code == 201,
                     f"Status: {resp.status_code}")
            
            if resp.status_code == 201:
                invoice = resp.json()
                self.test("Tax type is inter", invoice.get("tax_type") == "inter",
                         f"Got: {invoice.get('tax_type')}")
                
                totals = invoice.get("totals", {})
                # Taxable = 10 * 100 = 1000
                # GST 5% = 50 as IGST
                self.test("IGST is 50.0", totals.get("igst") == 50.0,
                         f"Got: {totals.get('igst')}")
                self.test("CGST is 0.0", totals.get("cgst") == 0.0,
                         f"Got: {totals.get('cgst')}")
                self.test("SGST is 0.0", totals.get("sgst") == 0.0,
                         f"Got: {totals.get('sgst')}")
                self.test("Grand total is 1050", totals.get("final") == 1050,
                         f"Got: {totals.get('final')}")
                
        except Exception as e:
            self.test("Inter-state GST computation", False, str(e))

    def test_invoices_no_real_names(self):
        """Test that invoices don't contain real customer names"""
        print("\n🔍 Testing Invoices for Real Names...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/invoices", timeout=10)
            self.test("Invoices API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                invoices = resp.json()
                self.check_forbidden_names(invoices, "invoices")
                
        except Exception as e:
            self.test("Invoices API call", False, str(e))

    def test_orders_no_real_names(self):
        """Test that orders don't contain real customer names"""
        print("\n🔍 Testing Orders for Real Names...")
        try:
            resp = requests.get(f"{BASE_URL}/graamam/orders", timeout=10)
            self.test("Orders API responds", resp.status_code == 200)
            
            if resp.status_code == 200:
                orders = resp.json()
                # Note: existing orders GC-8895 to GC-8903 use placeholder names like
                # Priya Sharma, Rajesh Iyer which are fine (not real customer data)
                self.check_forbidden_names(orders, "orders")
                
        except Exception as e:
            self.test("Orders API call", False, str(e))

    def test_rate_card_product_names(self):
        """Test that B2B rate card product names match Products master exactly"""
        print("\n🔍 Testing Rate Card Product Name Matching...")
        try:
            # Get products
            prod_resp = requests.get(f"{BASE_URL}/graamam/master/products", timeout=10)
            b2b_resp = requests.get(f"{BASE_URL}/graamam/master/customers/b2b", timeout=10)
            
            if prod_resp.status_code == 200 and b2b_resp.status_code == 200:
                products = prod_resp.json()
                product_names = {p.get("name") for p in products}
                
                customers = b2b_resp.json()
                for c in customers:
                    rate_card = c.get("rate_card", [])
                    for entry in rate_card:
                        prod_name = entry.get("product", "")
                        self.test(f"Rate card product '{prod_name}' exists in Products",
                                 prod_name in product_names,
                                 f"Product '{prod_name}' not found in master list")
                
        except Exception as e:
            self.test("Rate card product matching", False, str(e))

    def run_all_tests(self):
        """Run all test suites"""
        print("=" * 70)
        print("🧪 GRAAMAM CONNECT - PRIVACY FIX VERIFICATION")
        print("=" * 70)
        
        self.test_b2b_customers()
        self.test_b2c_customers()
        self.test_products_intact()
        self.test_costing_intact()
        self.test_gst_computation_intra_state()
        self.test_gst_computation_inter_state()
        self.test_invoices_no_real_names()
        self.test_orders_no_real_names()
        self.test_rate_card_product_names()
        
        print("\n" + "=" * 70)
        print(f"📊 RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 70)
        
        if self.issues:
            print("\n❌ ISSUES FOUND:")
            for issue in self.issues:
                print(f"  • {issue}")
            return 1
        else:
            print("\n✅ ALL TESTS PASSED - Privacy fix verified successfully!")
            return 0

def main():
    tester = GraamamPrivacyTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
