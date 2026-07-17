"""
Backend API Tests for ProtoVillage Graamam Orders (Phase 1)
Tests all endpoints at /api/graamam/orders using the preview URL.
"""
import requests
import sys
from datetime import datetime

class GraamamOrdersAPITester:
    def __init__(self, base_url="https://graamam-orders.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/graamam/orders"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, passed, message=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ PASS: {test_name}")
            if message:
                print(f"   {message}")
        else:
            print(f"❌ FAIL: {test_name}")
            print(f"   {message}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })

    def test_get_all_orders(self):
        """Test 1: GET /api/graamam/orders returns seeded orders"""
        test_name = "GET /api/graamam/orders - List all orders"
        try:
            response = requests.get(self.api_base, timeout=10)
            
            if response.status_code != 200:
                self.log_result(test_name, False, f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            if not isinstance(data, list):
                self.log_result(test_name, False, f"Expected list, got {type(data)}")
                return False
            
            if len(data) < 8:
                self.log_result(test_name, False, f"Expected at least 8 orders, got {len(data)}")
                return False
            
            # Verify structure of first order
            first_order = data[0]
            required_fields = ["id", "order_id", "customer", "items_count", "items_summary", 
                             "date", "total", "status", "created_at"]
            missing_fields = [f for f in required_fields if f not in first_order]
            
            if missing_fields:
                self.log_result(test_name, False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify customer structure
            customer = first_order.get("customer", {})
            if not isinstance(customer, dict) or "name" not in customer:
                self.log_result(test_name, False, "Customer object missing or invalid")
                return False
            
            self.log_result(test_name, True, f"Found {len(data)} orders with correct structure")
            return True
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")
            return False

    def test_filter_by_status(self):
        """Test 2: GET /api/graamam/orders?status=X filters correctly"""
        statuses = ["new", "packing", "dispatched", "delivered"]
        all_passed = True
        
        for status in statuses:
            test_name = f"GET /api/graamam/orders?status={status}"
            try:
                response = requests.get(f"{self.api_base}?status={status}", timeout=10)
                
                if response.status_code != 200:
                    self.log_result(test_name, False, f"Expected 200, got {response.status_code}")
                    all_passed = False
                    continue
                
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_result(test_name, False, f"Expected list, got {type(data)}")
                    all_passed = False
                    continue
                
                # Verify all orders have the correct status
                wrong_status = [o for o in data if o.get("status") != status]
                if wrong_status:
                    self.log_result(test_name, False, f"Found {len(wrong_status)} orders with wrong status")
                    all_passed = False
                    continue
                
                self.log_result(test_name, True, f"Found {len(data)} orders with status={status}")
                
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_get_counts(self):
        """Test 3: GET /api/graamam/orders/counts returns correct counts"""
        test_name = "GET /api/graamam/orders/counts"
        try:
            response = requests.get(f"{self.api_base}/counts", timeout=10)
            
            if response.status_code != 200:
                self.log_result(test_name, False, f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            required_keys = ["new", "packing", "dispatched", "delivered", "all"]
            missing_keys = [k for k in required_keys if k not in data]
            
            if missing_keys:
                self.log_result(test_name, False, f"Missing keys: {missing_keys}")
                return False
            
            # Verify all values are integers
            non_int = [k for k, v in data.items() if not isinstance(v, int)]
            if non_int:
                self.log_result(test_name, False, f"Non-integer values for: {non_int}")
                return False
            
            # Verify 'all' equals sum of statuses
            status_sum = data["new"] + data["packing"] + data["dispatched"] + data["delivered"]
            if data["all"] != status_sum:
                self.log_result(test_name, False, f"'all' count {data['all']} != sum {status_sum}")
                return False
            
            self.log_result(test_name, True, 
                          f"Counts: new={data['new']}, packing={data['packing']}, "
                          f"dispatched={data['dispatched']}, delivered={data['delivered']}, all={data['all']}")
            return True
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")
            return False

    def test_create_order_valid(self):
        """Test 4: POST /api/graamam/orders creates new order"""
        test_name = "POST /api/graamam/orders - Create valid order"
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            payload = {
                "customer_name": f"Test Customer {timestamp}",
                "items_count": 2,
                "total": 55.0,
                "status": "packing"
            }
            
            response = requests.post(
                self.api_base,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code != 201:
                self.log_result(test_name, False, 
                              f"Expected 201, got {response.status_code}. Response: {response.text}")
                return False
            
            data = response.json()
            
            # Verify response structure
            if not data.get("order_id", "").startswith("GC-"):
                self.log_result(test_name, False, f"Invalid order_id format: {data.get('order_id')}")
                return False
            
            if data.get("customer", {}).get("name") != payload["customer_name"]:
                self.log_result(test_name, False, "Customer name mismatch")
                return False
            
            if data.get("status") != payload["status"]:
                self.log_result(test_name, False, "Status mismatch")
                return False
            
            # Verify order appears in subsequent GET
            verify_response = requests.get(f"{self.api_base}?status=packing", timeout=10)
            if verify_response.status_code == 200:
                orders = verify_response.json()
                found = any(o.get("order_id") == data["order_id"] for o in orders)
                if not found:
                    self.log_result(test_name, False, "Created order not found in subsequent GET")
                    return False
            
            self.log_result(test_name, True, f"Created order {data['order_id']} successfully")
            return True
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")
            return False

    def test_create_order_invalid_status(self):
        """Test 5: POST /api/graamam/orders with invalid status returns 400"""
        test_name = "POST /api/graamam/orders - Invalid status"
        try:
            payload = {
                "customer_name": "Test Customer",
                "items_count": 1,
                "total": 10.0,
                "status": "invalid_status"
            }
            
            response = requests.post(
                self.api_base,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code != 400:
                self.log_result(test_name, False, 
                              f"Expected 400, got {response.status_code}. Should reject invalid status.")
                return False
            
            self.log_result(test_name, True, "Correctly rejected invalid status with 400")
            return True
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 70)
        print("ProtoVillage Graamam Orders - Backend API Tests")
        print(f"Testing: {self.base_url}")
        print("=" * 70)
        print()
        
        # Run tests in order
        self.test_get_all_orders()
        print()
        self.test_filter_by_status()
        print()
        self.test_get_counts()
        print()
        self.test_create_order_valid()
        print()
        self.test_create_order_invalid_status()
        
        # Summary
        print()
        print("=" * 70)
        print(f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 70)
        
        return self.tests_passed == self.tests_run

def main():
    tester = GraamamOrdersAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
