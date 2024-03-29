# frozen_string_literal: true

#
# Copyright (C) 2012 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.
#

describe Reporting::CountsReport do
  before do
    @account1 = Account.create!
  end

  describe "detailed report" do
    describe "courses" do
      it "counts available courses" do
        course_factory(account: @account1, active_all: 1)
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data["courses"]).to eq 1
      end

      it "does not count non-available courses" do
        @course1 = course_model(account: @account1)
        @course2 = course_model(account: @account1)
        @course2.destroy

        expect(@course1.workflow_state).to eq "claimed"
        expect(@course2.workflow_state).to eq "deleted"

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data["courses"]).to eq 0
      end
    end

    shared_examples_for "user_counts" do
      it "counts users that recently logged in" do
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 1
      end

      it "does not count users whose enrollment is deleted" do
        @enrollment.destroy

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 0
      end

      it "does not count users whose pseudonym is deleted" do
        @pseudonym.destroy

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 0
      end

      it "does not count users who haven't recently logged in" do
        @pseudonym.last_request_at = 2.months.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 0
      end
    end

    describe "teachers" do
      before do
        course_with_teacher(account: @account1, user: user_with_pseudonym, active_course: 1, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!
      end

      let(:datum) { "teachers" }

      include_examples "user_counts"
    end

    describe "students" do
      before do
        course_with_student(account: @account1, user: user_with_pseudonym, active_course: 1, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!
      end

      let(:datum) { "students" }

      include_examples "user_counts"
    end

    describe "users" do
      before do
        course_with_ta(account: @account1, user: user_with_pseudonym, active_course: 1, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!
      end

      let(:datum) { "users" }

      include_examples "user_counts"

      it "includes tas" do
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 1
      end

      it "includes teachers" do
        course_with_teacher(course: @course, user: user_with_pseudonym, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 2
      end

      it "includes students" do
        course_with_student(course: @course, user: user_with_pseudonym, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 2
      end

      it "includes designers" do
        course_with_designer(course: @course, user: user_with_pseudonym, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 2
      end

      it "includes observers" do
        course_with_observer(course: @course, user: user_with_pseudonym, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 2
      end

      it "does not include student view users" do
        course_with_user("StudentViewEnrollment", course: @course, user: user_with_pseudonym, active_enrollment: 1)
        @pseudonym.last_request_at = 1.day.ago
        @pseudonym.save!

        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data[datum]).to eq 1
      end
    end

    describe "files" do
      before do
        # the account needs a course in it to get data out of the report
        course_factory(account: @account1, active_course: 1)
      end

      it "counts files with the account's local id in the namespace" do
        attachment_model(namespace: "account_#{@account1.local_id}", size: 5 * 1024)
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data["files"]).to eq 1
        expect(@snapshot.data["files_size"]).to eq 5 * 1024
      end

      it "counts files with the account's global id in the namespace" do
        attachment_model(namespace: "account_#{@account1.global_id}", size: 3 * 1024)
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data["files"]).to eq 1
        expect(@snapshot.data["files_size"]).to eq 3 * 1024
      end

      it "counts with a heterogenous mixture of file namespaces" do
        attachment_model(namespace: "account_#{@account1.local_id}", size: 5 * 1024)
        attachment_model(namespace: "account_#{@account1.global_id}", size: 3 * 1024)
        Reporting::CountsReport.process_shard
        @snapshot = @account1.report_snapshots.detailed.first
        expect(@snapshot.data["files"]).to eq 2
        expect(@snapshot.data["files_size"]).to eq 8 * 1024
      end
    end
  end
end
