#!/usr/bin/env python3
"""
Test script for the Manim Renderer Service
"""

import requests
import json
import time
import sys

# Configuration
SERVICE_URL = "http://localhost:8000"

# Test Manim code
TEST_CODE = '''
# newtons_laws.py
from manim import *

class NewtonsLawsOfMotion(Scene):
    def construct(self):
        """
        This scene explains Newton's three laws of motion with animated examples.
        """
        # Intro Title
        intro_title = Title("Newton's Laws of Motion", color=BLUE)
        self.play(Write(intro_title))
        self.wait(2)
        self.play(FadeOut(intro_title))

        # --- Newton's First Law ---
        self.explain_first_law()

        # --- Newton's Second Law ---
        self.explain_second_law()

        # --- Newton's Third Law ---
        self.explain_third_law()

        # Outro
        self.play(FadeOut(*self.mobjects))
        outro_text = Text("Understanding these laws is fundamental to physics!").scale(0.8)
        self.play(Write(outro_text))
        self.wait(3)
        self.play(FadeOut(outro_text))

    def explain_first_law(self):
        """
        Creates the animation for Newton's First Law.
        """
        # Title and Law Text
        title1 = Title("Newton's First Law: The Law of Inertia")
        law1_text = Text(
            "An object remains at rest or in uniform motion unless acted upon by a net external force.",
            t2c={'at rest': YELLOW, 'uniform motion': YELLOW, 'net external force': RED},
            font_size=28
        ).next_to(title1, DOWN, buff=0.5)

        self.play(Write(title1))
        self.play(Write(law1_text))
        self.wait(3)
        self.play(FadeOut(law1_text))

        # Example 1: Object at Rest
        example1_title = Text("Example 1: An object at rest", font_size=32).to_edge(UP, buff=1.5)
        ground = Line(LEFT * 6, RIGHT * 6, color=WHITE).shift(DOWN * 2)
        ball = Circle(radius=0.5, color=GREEN, fill_opacity=1).next_to(ground, UP, buff=0)
        ball_label = Text("At Rest", font_size=24).next_to(ball, DOWN)

        self.play(Write(example1_title), Create(ground), DrawBorderThenFill(ball), Write(ball_label))
        self.wait(1.5)

        force_arrow = Arrow(LEFT, RIGHT, color=RED, buff=0).next_to(ball, LEFT, buff=0)
        force_label = Text("Force", font_size=24, color=RED).next_to(force_arrow, UP)
        self.play(GrowArrow(force_arrow), Write(force_label))
        self.play(
            ball.animate.shift(RIGHT * 5),
            FadeOut(ball_label),
            FadeOut(force_arrow),
            FadeOut(force_label),
            run_time=2
        )
        self.wait(2)
        self.play(FadeOut(example1_title), FadeOut(ground), FadeOut(ball))

        # Example 2: Object in Motion
        example2_title = Text("Example 2: An object in motion", font_size=32).to_edge(UP, buff=1.5)
        puck = Circle(radius=0.3, color=BLUE, fill_opacity=1).move_to(LEFT * 6)
        puck_velocity = Arrow(puck.get_center(), puck.get_center() + RIGHT * 1.5, color=YELLOW, buff=0)
        puck_label = Text("Constant Velocity", font_size=24).next_to(puck, DOWN)

        self.play(Write(example2_title), DrawBorderThenFill(puck), Write(puck_label))
        self.add(puck_velocity.add_updater(lambda m: m.next_to(puck, RIGHT, buff=0)))

        self.play(puck.animate.shift(RIGHT * 12), run_time=4, rate_func=linear)
        self.remove(puck_velocity)
        self.wait(2)

        self.play(FadeOut(example2_title), FadeOut(puck), FadeOut(puck_label), FadeOut(title1))

    def explain_second_law(self):
        """
        Creates the animation for Newton's Second Law.
        """
        # Title and Law Text
        title2 = Title("Newton's Second Law: F = ma")
        law2_text = Text(
            "The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.",
            t2c={'acceleration': YELLOW, 'net force': RED, 'mass': BLUE},
            font_size=28
        ).next_to(title2, DOWN, buff=0.5)
        formula = MathTex(r"F", r"=", r"m", r"a", font_size=60).next_to(law2_text, DOWN, buff=0.7)
        formula.set_color_by_tex("F", RED)
        formula.set_color_by_tex("m", BLUE)
        formula.set_color_by_tex("a", YELLOW)

        self.play(Write(title2))
        self.play(Write(law2_text))
        self.play(Write(formula))
        self.wait(3)
        self.play(FadeOut(law2_text))

        # Example: Force vs Mass
        force_label_1 = MathTex(r"F", color=RED).shift(LEFT * 4 + UP)
        force_arrow_1 = Arrow(LEFT, RIGHT, color=RED).next_to(force_label_1, DOWN)
        block_1 = Square(side_length=1.0, color=BLUE, fill_opacity=0.7).next_to(force_arrow_1, RIGHT)
        mass_label_1 = MathTex(r"m", color=BLUE).move_to(block_1.get_center())
        accel_label_1 = MathTex(r"a", color=YELLOW).next_to(block_1, UP)

        force_label_2 = MathTex(r"2F", color=RED).shift(RIGHT * 2 + UP)
        force_arrow_2 = Arrow(LEFT, RIGHT*2, color=RED).next_to(force_label_2, DOWN)
        block_2 = Square(side_length=1.0, color=BLUE, fill_opacity=0.7).next_to(force_arrow_2, RIGHT)
        mass_label_2 = MathTex(r"m", color=BLUE).move_to(block_2.get_center())
        accel_label_2 = MathTex(r"2a", color=YELLOW).next_to(block_2, UP)

        box1_group = VGroup(force_label_1, force_arrow_1, block_1, mass_label_1, accel_label_1)
        box2_group = VGroup(force_label_2, force_arrow_2, block_2, mass_label_2, accel_label_2)

        self.play(FadeIn(box1_group.shift(DOWN*1.5)), FadeIn(box2_group.shift(DOWN*1.5)))
        self.wait(1)
        self.play(
            block_1.animate.shift(RIGHT * 1),
            mass_label_1.animate.shift(RIGHT * 1),
            block_2.animate.shift(RIGHT * 2),
            mass_label_2.animate.shift(RIGHT * 2),
            run_time=1.5
        )
        self.wait(3)

        self.play(FadeOut(title2), FadeOut(formula), FadeOut(box1_group), FadeOut(box2_group))

    def explain_third_law(self):
        """
        Creates the animation for Newton's Third Law.
        """
        # Title and Law Text
        title3 = Title("Newton's Third Law: Action-Reaction")
        
        # CORRECTED PART: Using MarkupText to avoid ambiguity
        law3_text = MarkupText(
            f"For every <span fgcolor='{TEAL}'>action</span>, there is an equal and opposite <span fgcolor='{ORANGE}'>reaction</span>.",
            font_size=32
        ).next_to(title3, DOWN, buff=0.5)

        self.play(Write(title3))
        self.play(Write(law3_text))
        self.wait(3)

        # Example: Rocket Propulsion
        rocket_body = Polygon(
            [-1, -2, 0], [1, -2, 0], [1, 1, 0], [0, 2, 0], [-1, 1, 0],
            color=WHITE, fill_opacity=0.8
        ).scale(0.8)
        rocket_fin1 = Polygon([1, -1.5, 0], [1.5, -2.5, 0], [1, -2, 0], color=RED, fill_opacity=1)
        rocket_fin2 = Polygon([-1, -1.5, 0], [-1.5, -2.5, 0], [-1, -2, 0], color=RED, fill_opacity=1)
        rocket = VGroup(rocket_body, rocket_fin1, rocket_fin2).shift(DOWN*2)

        action_arrow = Arrow(UP, DOWN, color=TEAL, max_tip_length_to_length_ratio=0.2).next_to(rocket, DOWN, buff=0)
        action_label = Text("Action (Gas pushes down)", font_size=24, color=TEAL).next_to(action_arrow, DOWN)

        reaction_arrow = Arrow(DOWN, UP, color=ORANGE, max_tip_length_to_length_ratio=0.2).move_to(rocket.get_center())
        reaction_label = Text("Reaction (Rocket moves up)", font_size=24, color=ORANGE).next_to(reaction_arrow, UP)

        self.play(FadeIn(rocket), DrawBorderThenFill(action_arrow), Write(action_label))
        self.play(DrawBorderThenFill(reaction_arrow), Write(reaction_label))
        self.wait(1.5)

        self.play(
            rocket.animate.shift(UP * 4),
            reaction_arrow.animate.shift(UP * 4),
            FadeOut(action_arrow),
            FadeOut(action_label),
            FadeOut(reaction_label),
            run_time=2.5
        )
        self.wait(2)
        self.play(FadeOut(title3), FadeOut(law3_text), FadeOut(rocket), FadeOut(reaction_arrow))
'''

def test_service():
    """Test the manim renderer service"""
    
    print("🧪 Testing Manim Renderer Service...")
    
    # 1. Health check
    print("\n1. Checking service health...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            print("✅ Service is healthy")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Cannot connect to service: {e}")
        return False
    
    # 2. Submit rendering job
    print("\n2. Submitting rendering job...")
    try:
        response = requests.post(f"{SERVICE_URL}/render", json={
            "code": TEST_CODE,
            "scene_name": "SimpleAnimation",
            "quality": "medium_quality",
            "format": "mp4",
            "timeout": 120
        })
        
        if response.status_code == 200:
            job_data = response.json()
            job_id = job_data["job_id"]
            print(f"✅ Job submitted successfully: {job_id}")
        else:
            print(f"❌ Job submission failed: {response.status_code} - {response.text}")
            return False
    except requests.RequestException as e:
        print(f"❌ Job submission error: {e}")
        return False
    
    # 3. Monitor job progress
    print("\n3. Monitoring job progress...")
    max_wait_time = 180  # 3 minutes
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            response = requests.get(f"{SERVICE_URL}/status/{job_id}")
            if response.status_code == 200:
                status_data = response.json()
                status = status_data["status"]
                message = status_data["message"]
                progress = status_data.get("progress", 0)
                
                print(f"📊 Status: {status} - {message} ({progress}%)")
                
                if status == "completed":
                    print("✅ Job completed successfully!")
                    break
                elif status in ["error", "timeout"]:
                    print(f"❌ Job failed: {status}")
                    if "error_details" in status_data:
                        print(f"Error details: {status_data['error_details']}")
                    return False
                
            else:
                print(f"❌ Status check failed: {response.status_code}")
                return False
                
        except requests.RequestException as e:
            print(f"❌ Status check error: {e}")
            return False
        
        time.sleep(3)
    else:
        print("⏰ Timeout waiting for job completion")
        return False
    
    # 4. Download result
    print("\n4. Downloading result...")
    try:
        response = requests.get(f"{SERVICE_URL}/download/{job_id}")
        if response.status_code == 200:
            output_filename = f"test_output_{job_id}.mp4"
            with open(output_filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Video downloaded successfully: {output_filename}")
        else:
            print(f"❌ Download failed: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Download error: {e}")
        return False
    
    print("\n🎉 All tests passed! The Manim Renderer Service is working correctly.")
    return True

def test_sse_stream(job_id):
    """Test Server-Sent Events streaming"""
    print(f"\n📡 Testing SSE stream for job {job_id}...")
    
    try:
        response = requests.get(f"{SERVICE_URL}/status/{job_id}/stream", stream=True)
        if response.status_code == 200:
            print("✅ SSE stream connected")
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = json.loads(line[6:])  # Remove 'data: ' prefix
                        print(f"📨 SSE Update: {data}")
                        
                        if data.get('status') in ['completed', 'error', 'timeout']:
                            break
        else:
            print(f"❌ SSE connection failed: {response.status_code}")
            
    except requests.RequestException as e:
        print(f"❌ SSE stream error: {e}")

if __name__ == "__main__":
    print("Manim Renderer Service Test Suite")
    print("=" * 50)
    
    success = test_service()
    
    if success:
        print("\n🎊 Service test completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Service test failed!")
        sys.exit(1)